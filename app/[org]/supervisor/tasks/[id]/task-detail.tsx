"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteAdhocTask } from "@/actions/adhoc-tasks"
import { useToast } from "@/hooks/use-toast"
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
import {
  CheckCircle2,
  Clock,
  Trash2,
  ChevronLeft,
  CalendarDays,
  User,
} from "lucide-react"

interface TaskDetailProps {
  task: {
    id: string
    title: string
    description: string | null
    image_url: string | null
    due_date: string
    due_time: string | null
    status: string
    completed_at: string | null
    created_at: string
    assigned: { id: string; first_name: string; last_name: string } | null
    creator: { id: string; first_name: string; last_name: string } | null
  }
  orgSlug: string
}

export function TaskDetail({ task, orgSlug }: TaskDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const isDone = task.status === "done"

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteAdhocTask({ taskId: task.id })
    if (result.success) {
      toast({ title: "Task deleted" })
      router.push(`/${orgSlug}/supervisor/tasks`)
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/${orgSlug}/supervisor/tasks`)}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Tasks
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>{task.title}</CardTitle>
              <Badge
                variant="outline"
                className={
                  isDone
                    ? "border-success/30 bg-success/10 text-success dark:bg-success/20"
                    : "border-warning/30 bg-warning/10 text-warning dark:bg-warning/20"
                }
              >
                {isDone ? (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                ) : (
                  <Clock className="mr-1 h-3 w-3" />
                )}
                {isDone ? "Done" : "Pending"}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && (
            <div>
              <p className="text-sm font-medium mb-1">Description</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {task.image_url && (
            <div>
              <p className="text-sm font-medium mb-1">Reference Image</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={task.image_url}
                alt={task.title}
                className="w-full rounded-md border object-cover max-h-64"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Due</p>
                <p className="text-muted-foreground">
                  {task.due_date}
                  {task.due_time ? ` at ${task.due_time.slice(0, 5)}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Assigned to</p>
                <p className="text-muted-foreground">
                  {task.assigned
                    ? `${task.assigned.first_name} ${task.assigned.last_name}`
                    : "Unknown"}
                </p>
              </div>
            </div>
          </div>

          {isDone && task.completed_at && (
            <div className="rounded-md bg-success/10 p-3 text-sm text-success text-center">
              <CheckCircle2 className="inline mr-1 h-4 w-4" />
              Completed{" "}
              {new Date(task.completed_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete &quot;{task.title}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
