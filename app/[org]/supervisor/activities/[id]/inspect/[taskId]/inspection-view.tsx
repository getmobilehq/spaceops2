"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { inspectRoomTask } from "@/actions/activities"
import {
  CheckCircle2,
  XCircle,
  Building2,
  Clock,
  User,
  Check,
  X,
  ImageIcon,
  StickyNote,
} from "lucide-react"

interface TaskData {
  id: string
  room_id: string
  status: string
  started_at: string | null
  completed_at: string | null
  rooms: {
    id: string
    name: string
    room_type_id: string
    room_types: { name: string } | null
  } | null
  cleaning_activities: {
    id: string
    name: string
    status: string
    scheduled_date: string
    window_start: string
    window_end: string
    floors: {
      floor_name: string
      buildings: { name: string } | null
    } | null
  } | null
  users: {
    id: string
    first_name: string
    last_name: string
  } | null
}

interface ChecklistData {
  id: string
  name: string
  checklist_items: {
    id: string
    description: string
    item_order: number
    requires_photo: boolean
    requires_note: boolean
  }[]
}

interface ResponseData {
  id: string
  checklist_item_id: string
  is_completed: boolean
  photo_url: string | null
  note: string | null
}

export function InspectionView({
  task,
  checklist,
  responses,
  orgSlug,
  activityId,
}: {
  task: TaskData
  checklist: ChecklistData | null
  responses: ResponseData[]
  orgSlug: string
  activityId: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inspectionNote, setInspectionNote] = useState("")

  const room = task.rooms
  const activity = task.cleaning_activities
  const assignedUser = task.users
  const items = checklist?.checklist_items ?? []
  const responseMap = new Map(
    responses.map((r) => [r.checklist_item_id, r])
  )

  const completedCount = responses.filter((r) => r.is_completed).length
  const totalCount = items.length
  const progressPercent =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  async function handleInspect(result: "inspected_pass" | "inspected_fail") {
    setIsSubmitting(true)
    const res = await inspectRoomTask({
      taskId: task.id,
      result,
      note: inspectionNote || undefined,
    })

    if (res.success) {
      toast({
        title:
          result === "inspected_pass"
            ? "Inspection passed"
            : "Inspection failed",
      })
      router.push(`/${orgSlug}/supervisor/activities/${activityId}`)
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: res.error,
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-4">
      {/* Room header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-brand">
              {room?.name || "Unknown Room"}
            </CardTitle>
            <Badge
              variant="outline"
              className="border-green-200 bg-green-50 text-green-700"
            >
              Awaiting Inspection
            </Badge>
          </div>
          {room?.room_types && (
            <Badge variant="secondary" className="w-fit">
              {room.room_types.name}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          {activity?.floors?.buildings && (
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" />
              <span>
                {activity.floors.buildings.name} ·{" "}
                {activity.floors.floor_name}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {activity?.name} · {activity?.window_start.slice(0, 5)} –{" "}
              {activity?.window_end.slice(0, 5)}
            </span>
          </div>
          {assignedUser && (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              <span>
                Cleaned by {assignedUser.first_name}{" "}
                {assignedUser.last_name}
              </span>
            </div>
          )}
          {task.completed_at && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                Completed{" "}
                {new Date(task.completed_at).toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress summary */}
      {totalCount > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Checklist Completion</span>
            <span>
              {completedCount}/{totalCount} items
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-brand transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Checklist items review */}
      {checklist ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Checklist: {checklist.name}
          </h3>
          {items.map((item) => {
            const resp = responseMap.get(item.id)
            const isCompleted = resp?.is_completed ?? false
            const hasPhoto = !!resp?.photo_url
            const hasNote = !!resp?.note

            const photoPublicUrl = resp?.photo_url
              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cleaning-photos/${resp.photo_url}`
              : null

            return (
              <div
                key={item.id}
                className={`rounded-lg border p-3 space-y-2 ${
                  isCompleted
                    ? "bg-green-50/50 border-green-200"
                    : "bg-red-50/50 border-red-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 ${
                      isCompleted
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-red-300 bg-red-100 text-red-500"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug ${
                        isCompleted ? "text-muted-foreground" : "text-red-700"
                      }`}
                    >
                      {item.description}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {item.requires_photo && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            hasPhoto
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {hasPhoto ? "Photo added" : "No photo"}
                        </Badge>
                      )}
                      {item.requires_note && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            hasNote
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {hasNote ? "Note added" : "No note"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Photo display */}
                {hasPhoto && photoPublicUrl && (
                  <div className="ml-9">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPublicUrl}
                      alt="Cleaning photo"
                      className="h-24 w-24 rounded border object-cover"
                    />
                  </div>
                )}

                {hasPhoto && !photoPublicUrl && (
                  <div className="ml-9 flex items-center gap-1 text-xs text-muted-foreground">
                    <ImageIcon className="h-3 w-3" />
                    Photo attached
                  </div>
                )}

                {/* Note display */}
                {hasNote && (
                  <div className="ml-9 flex items-start gap-1.5 rounded-md bg-muted/50 p-2">
                    <StickyNote className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {resp?.note}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              No checklist was assigned for this room. Review based on
              general cleanliness standards.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Inspection note */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Inspection Note (optional)
        </label>
        <textarea
          value={inspectionNote}
          onChange={(e) => setInspectionNote(e.target.value)}
          placeholder="Add any comments about the inspection..."
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pb-4">
        <Button
          variant="outline"
          className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
          onClick={() => handleInspect("inspected_fail")}
          disabled={isSubmitting}
        >
          <XCircle className="mr-2 h-4 w-4" />
          {isSubmitting ? "Saving..." : "Fail"}
        </Button>
        <Button
          className="flex-1"
          onClick={() => handleInspect("inspected_pass")}
          disabled={isSubmitting}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {isSubmitting ? "Saving..." : "Pass"}
        </Button>
      </div>
    </div>
  )
}
