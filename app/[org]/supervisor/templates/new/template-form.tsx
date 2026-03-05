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
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createActivityTemplate } from "@/actions/activity-templates"
import { createClient } from "@/lib/supabase/client"
import { RecurrenceScheduler } from "@/components/shared/RecurrenceScheduler"
import { RefreshCw } from "lucide-react"

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

interface DefaultAssignment {
  roomId: string
  roomName: string
  roomType: string
  assignedTo: string | null
}

export function TemplateForm({
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [buildingId, setBuildingId] = useState("")
  const [floorId, setFloorId] = useState("")
  const [floors, setFloors] = useState<FloorOption[]>([])
  const [loadingFloors, setLoadingFloors] = useState(false)

  const [name, setName] = useState("")
  const [windowStart, setWindowStart] = useState("08:00")
  const [windowEnd, setWindowEnd] = useState("17:00")
  const [notes, setNotes] = useState("")

  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrence, setRecurrence] = useState({
    recurrenceDays: [] as string[],
    timeSlots: [{ window_start: "08:00", window_end: "17:00" }] as {
      window_start: string
      window_end: string
      label?: string
    }[],
    recurrencePreset: null as string | null,
  })

  const [assignments, setAssignments] = useState<DefaultAssignment[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)

  async function handleBuildingChange(id: string) {
    setBuildingId(id)
    setFloorId("")
    setAssignments([])
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

  async function handleFloorChange(id: string) {
    setFloorId(id)
    setLoadingRooms(true)

    const supabase = createClient()
    const { data } = await supabase
      .from("rooms")
      .select("id, name, room_types(name)")
      .eq("floor_id", id)
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

  async function handleSubmit() {
    setIsSubmitting(true)

    const defaultAssignments = assignments
      .filter((a) => a.assignedTo)
      .map((a) => ({ room_id: a.roomId, assigned_to: a.assignedTo! }))

    const firstSlot = isRecurring && recurrence.timeSlots.length > 0
      ? recurrence.timeSlots[0]
      : null

    const result = await createActivityTemplate({
      name,
      floorId,
      windowStart: firstSlot ? firstSlot.window_start : windowStart,
      windowEnd: firstSlot ? firstSlot.window_end : windowEnd,
      notes: notes || undefined,
      defaultAssignments,
      isRecurring,
      recurrenceDays: isRecurring ? recurrence.recurrenceDays as ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[] : [],
      timeSlots: isRecurring ? recurrence.timeSlots : [],
      recurrencePreset: isRecurring ? recurrence.recurrencePreset as "once_daily" | "twice_daily" | "three_daily" | "custom" | null : null,
    })

    if (result.success) {
      toast({
        title: isRecurring ? "Recurring schedule created" : "Template created",
      })
      router.push(`/${orgSlug}/supervisor/templates/${result.id}`)
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsSubmitting(false)
  }

  const isValid =
    !!name &&
    !!floorId &&
    (!isRecurring || (recurrence.recurrenceDays.length > 0 && recurrence.timeSlots.length > 0))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Template Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label>Template Name</Label>
          <Input
            placeholder="e.g. Evening Clean — Floor 2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Floor selection */}
        <div className="grid grid-cols-2 gap-4">
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
          <div className="space-y-2">
            <Label>Floor</Label>
            {loadingFloors ? (
              <p className="text-sm text-muted-foreground pt-2">Loading...</p>
            ) : (
              <Select value={floorId} onValueChange={handleFloorChange}>
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
        </div>

        {/* Recurring toggle */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Recurring Schedule</p>
              <p className="text-xs text-muted-foreground">
                Auto-generate activities on a schedule
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isRecurring}
            onClick={() => setIsRecurring(!isRecurring)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              isRecurring ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
                isRecurring ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Recurrence scheduler */}
        {isRecurring && (
          <RecurrenceScheduler value={recurrence} onChange={setRecurrence} />
        )}

        {/* Time window (only when not recurring) */}
        {!isRecurring && (
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
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Input
            placeholder="Any special instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Default assignments */}
        {floorId && (
          <div className="space-y-3">
            <Label>Default Assignments (optional)</Label>
            {loadingRooms ? (
              <p className="text-sm text-muted-foreground">Loading rooms...</p>
            ) : assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active rooms on this floor.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Assign all to:</span>
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
                        <p className="text-xs text-muted-foreground">{a.roomType}</p>
                      </div>
                      <Select
                        value={a.assignedTo || "none"}
                        onValueChange={(v) =>
                          handleAssign(a.roomId, v === "none" ? null : v)
                        }
                      >
                        <SelectTrigger className="w-44 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No default</SelectItem>
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

        {/* Submit */}
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting
              ? "Creating..."
              : isRecurring
              ? "Create Recurring Schedule"
              : "Create Template"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
