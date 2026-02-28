import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getJanitorTaskHistory } from "@/lib/queries/activities"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
} from "lucide-react"

export const metadata = {
  title: "Task History - SpaceOps",
}

const statusConfig: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  done: {
    label: "Awaiting Inspection",
    className: "border-yellow-200 bg-yellow-50 text-yellow-700",
    icon: Clock,
  },
  inspected_pass: {
    label: "Passed",
    className: "border-green-200 bg-green-50 text-green-700",
    icon: CheckCircle2,
  },
  inspected_fail: {
    label: "Failed",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: XCircle,
  },
}

export default async function JanitorHistoryPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()
  const role = user.app_metadata?.role as string | undefined
  if (role !== "janitor") return notFound()

  const tasks = await getJanitorTaskHistory(supabase, user.id)

  // Group by date
  const grouped = new Map<string, typeof tasks>()
  for (const task of tasks) {
    const date = (task.cleaning_activities as any)?.scheduled_date || "Unknown"
    if (!grouped.has(date)) grouped.set(date, [])
    grouped.get(date)!.push(task)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Task History</h1>
        <p className="text-muted-foreground">
          Your completed tasks and inspection results
        </p>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No completed tasks yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        Array.from(grouped.entries()).map(([date, dateTasks]) => (
          <div key={date} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {date !== "Unknown"
                ? new Date(date).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Unknown Date"}
            </div>
            {dateTasks.map((task) => {
              const sc = statusConfig[task.status] || statusConfig.done
              const StatusIcon = sc.icon
              const roomName =
                (task.rooms as any)?.name || "Unknown Room"
              const roomType =
                (task.rooms as any)?.room_types?.name || ""
              const activityName =
                (task.cleaning_activities as any)?.name || "Unknown Activity"
              const buildingName =
                (task.cleaning_activities as any)?.floors?.buildings?.name || ""

              return (
                <Card key={task.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <StatusIcon className="h-4 w-4 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {roomName}
                            {roomType && (
                              <span className="text-muted-foreground font-normal">
                                {" "}
                                ({roomType})
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {activityName}
                            {buildingName && ` · ${buildingName}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={sc.className}>
                        {sc.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
