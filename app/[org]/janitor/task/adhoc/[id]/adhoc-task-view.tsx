"use client"

import { useState } from "react"
import Link from "next/link"
import { completeAdhocTask } from "@/actions/adhoc-tasks"
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
  CheckCircle2,
  Clock,
  ChevronLeft,
  CalendarDays,
  Loader2,
} from "lucide-react"

interface AdhocTaskViewProps {
  task: {
    id: string
    title: string
    description: string | null
    image_url: string | null
    due_date: string
    due_time: string | null
    status: string
    completed_at: string | null
  }
  orgSlug: string
}

export function AdhocTaskView({ task, orgSlug }: AdhocTaskViewProps) {
  const { toast } = useToast()
  const [isCompleting, setIsCompleting] = useState(false)
  const [isDone, setIsDone] = useState(task.status === "done")

  async function handleComplete() {
    setIsCompleting(true)
    const result = await completeAdhocTask({ taskId: task.id })

    if (result.success) {
      setIsDone(true)
      toast({ title: "Task completed" })
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsCompleting(false)
  }

  return (
    <>
      <Link
        href={`/${orgSlug}/janitor/today`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Today
      </Link>

      {isDone && (
        <div className="rounded-md bg-success/10 border border-success/30 p-3 text-sm text-success flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Task completed
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{task.title}</CardTitle>
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
        </CardHeader>
        <CardContent className="space-y-4">
          {task.due_time && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              Due by {task.due_time.slice(0, 5)}
            </div>
          )}

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
              <p className="text-sm font-medium mb-1">Reference</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={task.image_url}
                alt={task.title}
                className="w-full rounded-md border object-cover max-h-64"
              />
            </div>
          )}

          {!isDone && (
            <Button
              className="w-full"
              onClick={handleComplete}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Done
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  )
}
