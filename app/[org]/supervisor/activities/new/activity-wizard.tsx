"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createActivity, assignRoomTasks, publishActivity } from "@/actions/activities"
import { createClient } from "@/lib/supabase/client"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"

interface BuildingOption {
  id: string
  name: string
}

interface JanitorOption {
  id: string
  first_name: string
  last_name: string
}

interface FloorOption {
  id: string
  floor_name: string
  floor_number: number
}

interface RoomOption {
  id: string
  name: string
  room_types: { name: string } | null
}

interface Assignment {
  roomId: string
  roomName: string
  roomType: string
  assignedTo: string | null
}

const STEPS = ["Select Floor", "Schedule", "Assign Rooms", "Review"]

export function ActivityWizard({
  buildings,
  janitors,
  orgSlug,
}: {
  buildings: BuildingOption[]
  janitors: JanitorOption[]
  orgSlug: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: Floor selection
  const [buildingId, setBuildingId] = useState("")
  const [floorId, setFloorId] = useState("")
  const [floors, setFloors] = useState<FloorOption[]>([])
  const [loadingFloors, setLoadingFloors] = useState(false)

  // Step 2: Schedule
  const [name, setName] = useState("")
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [windowStart, setWindowStart] = useState("08:00")
  const [windowEnd, setWindowEnd] = useState("17:00")
  const [notes, setNotes] = useState("")

  // Step 3: Assignments
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)

  async function handleBuildingChange(id: string) {
    setBuildingId(id)
    setFloorId("")
    setLoadingFloors(true)

    const supabase = createClient()
    const { data } = await supabase
      .from("floors")
      .select("id, floor_name, floor_number")
      .eq("building_id", id)
      .order("floor_number", { ascending: true })

    setFloors(data || [])
    setLoadingFloors(false)
  }

  async function handleFloorSelected() {
    if (!floorId) return
    setLoadingRooms(true)

    const supabase = createClient()
    const { data } = await supabase
      .from("rooms")
      .select("id, name, room_types(name)")
      .eq("floor_id", floorId)
      .eq("is_active", true)
      .order("name", { ascending: true })

    setAssignments(
      (data || []).map((r: RoomOption) => ({
        roomId: r.id,
        roomName: r.name,
        roomType: r.room_types?.name || "Unknown",
        assignedTo: null,
      }))
    )
    setLoadingRooms(false)
  }

  function handleAssign(roomId: string, janitorId: string | null) {
    setAssignments((prev) =>
      prev.map((a) =>
        a.roomId === roomId ? { ...a, assignedTo: janitorId } : a
      )
    )
  }

  function handleAssignAll(janitorId: string) {
    setAssignments((prev) =>
      prev.map((a) => ({ ...a, assignedTo: janitorId }))
    )
  }

  async function handleSubmit(publish: boolean) {
    setIsSubmitting(true)

    const result = await createActivity({
      floorId,
      name,
      scheduledDate,
      windowStart,
      windowEnd,
      notes: notes || undefined,
    })

    if (!result.success) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
      setIsSubmitting(false)
      return
    }

    const activityId = result.id

    // Assign rooms
    const withAssignees = assignments.filter((a) => a.assignedTo)
    if (withAssignees.length > 0) {
      const assignResult = await assignRoomTasks({
        activityId,
        assignments: withAssignees.map((a) => ({
          roomId: a.roomId,
          assignedTo: a.assignedTo,
        })),
      })
      if (!assignResult.success) {
        toast({
          title: "Warning",
          description: "Activity created but some assignments failed",
          variant: "destructive",
        })
      }
    }

    if (publish) {
      const pubResult = await publishActivity({ activityId })
      if (!pubResult.success) {
        toast({
          title: "Saved as draft",
          description: pubResult.error,
        })
      } else {
        toast({ title: "Activity published" })
      }
    } else {
      toast({ title: "Activity saved as draft" })
    }

    setIsSubmitting(false)
    router.push(`/${orgSlug}/supervisor/activities/${activityId}`)
  }

  function canAdvance() {
    if (step === 0) return !!floorId
    if (step === 1) return !!name && !!scheduledDate && !!windowStart && !!windowEnd
    return true
  }

  function handleNext() {
    if (step === 0) {
      handleFloorSelected()
    }
    setStep((s) => s + 1)
  }

  const selectedBuilding = buildings.find((b) => b.id === buildingId)
  const selectedFloor = floors.find((f) => f.id === floorId)
  const assignedCount = assignments.filter((a) => a.assignedTo).length
  const janitorMap = new Map(
    janitors.map((j) => [j.id, `${j.first_name} ${j.last_name}`])
  )

  return (
    <Card>
      {/* Step indicator */}
      <CardHeader>
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  i < step
                    ? "bg-brand text-white"
                    : i === step
                    ? "bg-brand text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={`text-xs hidden sm:inline ${
                  i === step ? "font-medium" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className="w-6 border-t border-muted-foreground/30" />
              )}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Step 0: Select Floor */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Building</Label>
              <Select value={buildingId} onValueChange={handleBuildingChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select building" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {buildingId && (
              <div className="space-y-2">
                <Label>Floor</Label>
                {loadingFloors ? (
                  <p className="text-sm text-muted-foreground">Loading floors...</p>
                ) : (
                  <Select value={floorId} onValueChange={setFloorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {floors.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.floor_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Schedule */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Activity Name</Label>
              <Input
                placeholder="e.g. Evening Clean — Floor 2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={windowStart}
                  onChange={(e) => setWindowStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={windowEnd}
                  onChange={(e) => setWindowEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Any special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 2: Assign Rooms */}
        {step === 2 && (
          <div className="space-y-4">
            {loadingRooms ? (
              <p className="text-sm text-muted-foreground">Loading rooms...</p>
            ) : assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active rooms on this floor.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Assign all to:</Label>
                  <Select onValueChange={handleAssignAll}>
                    <SelectTrigger className="w-48 h-8">
                      <SelectValue placeholder="Select janitor" />
                    </SelectTrigger>
                    <SelectContent>
                      {janitors.map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.first_name} {j.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  {assignments.map((a) => (
                    <div
                      key={a.roomId}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{a.roomName}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.roomType}
                        </p>
                      </div>
                      <Select
                        value={a.assignedTo || "unassigned"}
                        onValueChange={(v) =>
                          handleAssign(a.roomId, v === "unassigned" ? null : v)
                        }
                      >
                        <SelectTrigger className="w-44 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {janitors.map((j) => (
                            <SelectItem key={j.id} value={j.id}>
                              {j.first_name} {j.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-md border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Building</span>
                <span>{selectedBuilding?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Floor</span>
                <span>{selectedFloor?.floor_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span>{scheduledDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span>
                  {windowStart} – {windowEnd}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rooms</span>
                <span>
                  {assignedCount}/{assignments.length} assigned
                </span>
              </div>
              {notes && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Notes</span>
                  <span>{notes}</span>
                </div>
              )}
            </div>

            {assignments.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Room Assignments
                </p>
                {assignments.map((a) => (
                  <div
                    key={a.roomId}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <span>{a.roomName}</span>
                    <span className="text-muted-foreground">
                      {a.assignedTo
                        ? janitorMap.get(a.assignedTo) || "Unknown"
                        : "Unassigned"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>

          {step < 3 ? (
            <Button onClick={handleNext} disabled={!canAdvance()}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save as Draft"}
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting || assignedCount === 0}
              >
                {isSubmitting ? "Publishing..." : "Publish"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
