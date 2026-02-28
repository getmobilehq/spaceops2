"use client"

import { useState } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ActivityStatusBadge } from "@/components/shared/ActivityStatusBadge"
import {
  publishActivity,
  cancelActivity,
  closeActivity,
  assignRoomTasks,
  deleteActivity,
} from "@/actions/activities"
import { saveActivityAsTemplate } from "@/actions/activity-templates"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ClipboardCheck,
  BookTemplate,
  Trash2,
} from "lucide-react"

interface RoomTask {
  id: string
  room_id: string
  assigned_to: string | null
  status: string
  rooms: { name: string; room_types: { name: string } | null } | null
  users: { id: string; first_name: string; last_name: string } | null
}

interface ActivityData {
  id: string
  name: string
  status: string
  scheduled_date: string
  window_start: string
  window_end: string
  notes: string | null
  floors: {
    floor_name: string
    buildings: { name: string } | null
  } | null
  room_tasks: RoomTask[]
}

interface JanitorOption {
  id: string
  first_name: string
  last_name: string
}

const taskStatusConfig: Record<string, { label: string; className: string }> = {
  not_started: { label: "Not Started", className: "border-gray-200 bg-gray-50 text-gray-700" },
  in_progress: { label: "In Progress", className: "border-yellow-200 bg-yellow-50 text-yellow-700" },
  done: { label: "Done", className: "border-green-200 bg-green-50 text-green-700" },
  has_issues: { label: "Has Issues", className: "border-red-200 bg-red-50 text-red-700" },
  inspected_pass: { label: "Passed", className: "border-green-200 bg-green-50 text-green-700" },
  inspected_fail: { label: "Failed", className: "border-red-200 bg-red-50 text-red-700" },
}

export function ActivityDetail({
  activity,
  janitors,
  orgSlug,
}: {
  activity: ActivityData
  janitors: JanitorOption[]
  orgSlug: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPublishing, setIsPublishing] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isSavingAssignments, setIsSavingAssignments] = useState(false)
  const [localTasks, setLocalTasks] = useState(activity.room_tasks)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)

  const isDraft = activity.status === "draft"
  const isActive = activity.status === "active"
  const doneCount = activity.room_tasks.filter(
    (t) => t.status === "done" || t.status === "inspected_pass"
  ).length

  async function handlePublish() {
    setIsPublishing(true)
    const result = await publishActivity({ activityId: activity.id })
    if (result.success) {
      toast({ title: "Activity published" })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsPublishing(false)
  }

  async function handleCancel() {
    setIsCancelling(true)
    const result = await cancelActivity({ activityId: activity.id })
    if (result.success) {
      toast({ title: "Activity cancelled" })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsCancelling(false)
    setConfirmCancel(false)
  }

  async function handleClose() {
    setIsClosing(true)
    const result = await closeActivity({ activityId: activity.id })
    if (result.success) {
      toast({ title: "Activity closed" })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsClosing(false)
  }

  function handleLocalAssign(roomId: string, janitorId: string | null) {
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.room_id === roomId ? { ...t, assigned_to: janitorId } : t
      )
    )
  }

  async function handleSaveAssignments() {
    setIsSavingAssignments(true)
    const result = await assignRoomTasks({
      activityId: activity.id,
      assignments: localTasks.map((t) => ({
        roomId: t.room_id,
        assignedTo: t.assigned_to,
      })),
    })
    if (result.success) {
      toast({ title: "Assignments saved" })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsSavingAssignments(false)
  }

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteActivity({ activityId: activity.id })
    if (result.success) {
      toast({ title: "Activity deleted" })
      router.push(`/${orgSlug}/supervisor/activities`)
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsDeleting(false)
    setConfirmDelete(false)
  }

  async function handleSaveAsTemplate() {
    if (!templateName) return
    setIsSavingTemplate(true)
    const result = await saveActivityAsTemplate({
      activityId: activity.id,
      name: templateName,
    })
    if (result.success) {
      toast({ title: "Template saved" })
      setShowSaveTemplate(false)
      setTemplateName("")
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsSavingTemplate(false)
  }

  const hasAssignmentChanges = localTasks.some(
    (t) =>
      t.assigned_to !==
      activity.room_tasks.find((orig) => orig.id === t.id)?.assigned_to
  )

  return (
    <>
      {/* Back link */}
      <Link
        href={`/${orgSlug}/supervisor/activities`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Activities
      </Link>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle>{activity.name}</CardTitle>
                <ActivityStatusBadge status={activity.status} />
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {activity.floors?.buildings?.name} · {activity.floors?.floor_name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {activity.scheduled_date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {activity.window_start.slice(0, 5)} – {activity.window_end.slice(0, 5)}
                </span>
              </div>
              {activity.notes && (
                <p className="text-sm text-muted-foreground mt-1">
                  {activity.notes}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSaveTemplate(true)}
              >
                <BookTemplate className="mr-1 h-3.5 w-3.5" />
                Save as Template
              </Button>
              {isDraft && (
                <Button
                  size="sm"
                  onClick={handlePublish}
                  disabled={isPublishing}
                >
                  {isPublishing ? "Publishing..." : "Publish"}
                </Button>
              )}
              {isActive && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isClosing}
                >
                  {isClosing ? "Closing..." : "Close"}
                </Button>
              )}
              {(isDraft || isActive) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmCancel(true)}
                >
                  Cancel
                </Button>
              )}
              {isDraft && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {doneCount}/{activity.room_tasks.length} rooms done
          </div>
        </CardContent>
      </Card>

      {/* Room Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Room Tasks</CardTitle>
          {isDraft && hasAssignmentChanges && (
            <Button
              size="sm"
              onClick={handleSaveAssignments}
              disabled={isSavingAssignments}
            >
              {isSavingAssignments ? "Saving..." : "Save Assignments"}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {(isDraft ? localTasks : activity.room_tasks).map((task) => {
            const statusConf = taskStatusConfig[task.status] || taskStatusConfig.not_started
            return (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {task.rooms?.name || "Unknown Room"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {task.rooms?.room_types?.name || "Unknown type"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isDraft ? (
                    <Select
                      value={task.assigned_to || "unassigned"}
                      onValueChange={(v) =>
                        handleLocalAssign(
                          task.room_id,
                          v === "unassigned" ? null : v
                        )
                      }
                    >
                      <SelectTrigger className="w-40 h-8">
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
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {task.users
                        ? `${task.users.first_name} ${task.users.last_name}`
                        : "Unassigned"}
                    </span>
                  )}
                  {isActive && task.status === "done" && (
                    <Link
                      href={`/${orgSlug}/supervisor/activities/${activity.id}/inspect/${task.id}`}
                    >
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <ClipboardCheck className="mr-1 h-3.5 w-3.5" />
                        Inspect
                      </Button>
                    </Link>
                  )}
                  <Badge variant="outline" className={statusConf.className}>
                    {statusConf.label}
                  </Badge>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Cancel confirmation */}
      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Activity</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this activity? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmCancel(false)}
              disabled={isCancelling}
            >
              Keep
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Cancel Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this draft activity? All room tasks will be removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save as Template */}
      <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Template Name</Label>
            <Input
              placeholder="e.g. Evening Clean — Floor 2"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveTemplate(false)}
              disabled={isSavingTemplate}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAsTemplate}
              disabled={!templateName || isSavingTemplate}
            >
              {isSavingTemplate ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
