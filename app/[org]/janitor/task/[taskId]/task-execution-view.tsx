"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { completeRoomTask } from "@/actions/task-responses"
import { ChecklistItemRow } from "./checklist-item-row"
import {
  ChevronLeft,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
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

export function TaskExecutionView({
  task,
  checklist,
  existingResponses,
  orgSlug,
}: {
  task: TaskData
  checklist: ChecklistData | null
  existingResponses: ResponseData[]
  orgSlug: string
}) {
  const router = useRouter()
  const { toast } = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showIssueDialog, setShowIssueDialog] = useState(false)
  const [issueNote, setIssueNote] = useState("")

  // Local response state keyed by checklist_item_id
  const [responses, setResponses] = useState<
    Map<string, { is_completed: boolean; photo_url: string | null; note: string | null }>
  >(() => {
    const map = new Map()
    for (const r of existingResponses) {
      map.set(r.checklist_item_id, {
        is_completed: r.is_completed,
        photo_url: r.photo_url,
        note: r.note,
      })
    }
    return map
  })

  const room = task.rooms
  const activity = task.cleaning_activities
  const items = useMemo(
    () => checklist?.checklist_items ?? [],
    [checklist?.checklist_items]
  )
  const isReadOnly = task.status === "done" || task.status === "has_issues"

  // Progress calculation
  const completedCount = useMemo(() => {
    let count = 0
    for (const item of items) {
      const resp = responses.get(item.id)
      if (resp?.is_completed) count++
    }
    return count
  }, [items, responses])

  const totalCount = items.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // Check if all requirements are satisfied for "Mark Done"
  const canMarkDone = useMemo(() => {
    if (items.length === 0) return true // No checklist = can always mark done
    for (const item of items) {
      const resp = responses.get(item.id)
      if (!resp?.is_completed) return false
      if (item.requires_photo && !resp.photo_url) return false
      if (item.requires_note && !resp.note) return false
    }
    return true
  }, [items, responses])

  function handleResponseChange(
    itemId: string,
    update: { is_completed?: boolean; photo_url?: string; note?: string }
  ) {
    setResponses((prev) => {
      const next = new Map(prev)
      const existing = next.get(itemId) || {
        is_completed: false,
        photo_url: null,
        note: null,
      }
      next.set(itemId, { ...existing, ...update })
      return next
    })
  }

  async function handleMarkDone() {
    setIsSubmitting(true)
    const result = await completeRoomTask({
      roomTaskId: task.id,
      status: "done",
    })

    if (result.success) {
      toast({ title: "Room marked as done" })
      router.push(`/${orgSlug}/janitor/today`)
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  async function handleFlagIssue() {
    setIsSubmitting(true)
    const result = await completeRoomTask({
      roomTaskId: task.id,
      status: "has_issues",
      issueNote: issueNote || undefined,
    })

    if (result.success) {
      toast({ title: "Issue reported" })
      setShowIssueDialog(false)
      router.push(`/${orgSlug}/janitor/today`)
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  const statusConfig: Record<string, { label: string; className: string }> = {
    not_started: { label: "Not Started", className: "border-gray-200 bg-gray-50 text-gray-700" },
    in_progress: { label: "In Progress", className: "border-yellow-200 bg-yellow-50 text-yellow-700" },
    done: { label: "Done", className: "border-green-200 bg-green-50 text-green-700" },
    has_issues: { label: "Has Issues", className: "border-red-200 bg-red-50 text-red-700" },
  }

  const currentStatus = statusConfig[task.status] || statusConfig.not_started

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        href={`/${orgSlug}/janitor/today`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Today
      </Link>

      {/* Completed / Issue banner */}
      {task.status === "done" && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <p className="text-sm font-medium text-green-800">
            Room completed
          </p>
        </div>
      )}
      {task.status === "has_issues" && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <p className="text-sm font-medium text-red-800">
            Issue reported for this room
          </p>
        </div>
      )}

      {/* Room header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-brand">
              {room?.name || "Unknown Room"}
            </CardTitle>
            <Badge variant="outline" className={currentStatus.className}>
              {currentStatus.label}
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
                {activity.floors.buildings.name} · {activity.floors.floor_name}
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
        </CardContent>
      </Card>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
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

      {/* Checklist */}
      {checklist ? (
        <div className="space-y-2">
          {items.map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              response={responses.get(item.id) || null}
              roomTaskId={task.id}
              isReadOnly={isReadOnly}
              onResponseChange={handleResponseChange}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              No checklist available for this room type. You can mark this room
              as done directly.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      {!isReadOnly && (
        <div className="flex gap-3 pb-4">
          <Button
            variant="outline"
            className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => setShowIssueDialog(true)}
            disabled={isSubmitting}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Flag Issue
          </Button>
          <Button
            className="flex-1"
            onClick={handleMarkDone}
            disabled={isSubmitting || !canMarkDone}
          >
            {isSubmitting ? "Saving..." : "Mark Done"}
          </Button>
        </div>
      )}

      {/* Issue dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>
              Describe the issue you found in this room. Your supervisor will be
              notified.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={issueNote}
            onChange={(e) => setIssueNote(e.target.value)}
            placeholder="Describe the issue..."
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowIssueDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleFlagIssue}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
