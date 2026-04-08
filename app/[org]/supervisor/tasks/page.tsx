import { createClient } from "@/lib/supabase/server"
import { getSupervisorAdhocTasks } from "@/lib/queries/adhoc-tasks"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, CheckCircle2, Clock } from "lucide-react"

export const metadata = {
  title: "Tasks - SpaceOps",
}

export default async function TasksPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const tasks = await getSupervisorAdhocTasks(supabase)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tasks</h1>
          <p className="text-muted-foreground">
            One-off tasks assigned to janitors
          </p>
        </div>
        <Link href={`/${params.org}/supervisor/tasks/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No tasks yet. Create a one-off task to assign to a janitor.
          </p>
          <Link href={`/${params.org}/supervisor/tasks/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const assigned = task.assigned as {
              id: string
              first_name: string
              last_name: string
            } | null
            const isDone = task.status === "done"

            return (
              <Link
                key={task.id}
                href={`/${params.org}/supervisor/tasks/${task.id}`}
              >
                <Card className="hover:bg-muted/50 transition-colors mb-3">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            Assigned to:{" "}
                            {assigned
                              ? `${assigned.first_name} ${assigned.last_name}`
                              : "Unknown"}
                          </span>
                          <span>
                            Due: {task.due_date}
                            {task.due_time
                              ? ` at ${task.due_time.slice(0, 5)}`
                              : ""}
                          </span>
                        </div>
                      </div>
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
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
