import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import {
  getJanitorTaskHistory,
  getJanitorPerformanceStats,
  getJanitorPerformanceTrend,
} from "@/lib/queries/activities"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  CalendarDays,
  Flame,
  BarChart3,
  ListTodo,
  CheckCircle2,
} from "lucide-react"
import { INSPECTION_STATUS } from "@/lib/status-styles"
import { getJanitorCompletedAdhocTasks } from "@/lib/queries/adhoc-tasks"

export const metadata = {
  title: "Task History - SpaceOps",
}


export default async function JanitorHistoryPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()
  const role = user.app_metadata?.role as string | undefined
  if (role !== "janitor") return notFound()

  const [tasks, perfStats, perfTrend, completedAdhocTasks] = await Promise.all([
    getJanitorTaskHistory(supabase, user.id),
    getJanitorPerformanceStats(supabase, user.id),
    getJanitorPerformanceTrend(supabase, user.id),
    getJanitorCompletedAdhocTasks(supabase, user.id),
  ])

  // Group by date
  const grouped = new Map<string, typeof tasks>()
  for (const task of tasks) {
    const date = (task.cleaning_activities as { scheduled_date?: string; name?: string; floors?: { buildings?: { name?: string } } } | null)?.scheduled_date || "Unknown"
    if (!grouped.has(date)) grouped.set(date, [])
    grouped.get(date)!.push(task)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Task History</h1>
        <p className="text-muted-foreground">
          Your completed tasks and inspection results
        </p>
      </div>

      {/* Performance stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pass Rate</p>
            <p className="text-2xl font-bold">
              {perfStats.passRate !== null ? (
                <span
                  className={
                    perfStats.passRate >= 80
                      ? "text-success"
                      : perfStats.passRate >= 50
                      ? "text-warning"
                      : "text-destructive"
                  }
                >
                  {perfStats.passRate}%
                </span>
              ) : (
                <span className="text-muted-foreground">N/A</span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Tasks Completed</p>
            <p className="text-2xl font-bold">{perfStats.totalCompleted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Inspections</p>
            <p className="text-2xl font-bold">
              <span className="text-success">{perfStats.passed}</span>
              {" / "}
              <span className="text-destructive">{perfStats.failed}</span>
            </p>
            <p className="text-xs text-muted-foreground">passed / failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <p className="text-sm text-muted-foreground">Streak</p>
            </div>
            <p className="text-2xl font-bold">
              {perfStats.currentStreak > 0 ? (
                <span className="text-orange-500">
                  {perfStats.currentStreak}
                </span>
              ) : (
                <span className="text-muted-foreground">0</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">consecutive passes</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly trend */}
      {perfTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Weekly Performance (Last 8 Weeks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {perfTrend.map((week) => {
                const total = week.passed + week.failed
                const passRate =
                  total > 0 ? Math.round((week.passed / total) * 100) : null
                const weekLabel = new Date(week.week).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "short" }
                )
                return (
                  <div key={week.week} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground w-16">
                        {weekLabel}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-success">
                          {week.passed} passed
                        </span>
                        {week.failed > 0 && (
                          <span className="text-destructive">
                            {week.failed} failed
                          </span>
                        )}
                        {week.done > 0 && (
                          <span className="text-warning">
                            {week.done} awaiting
                          </span>
                        )}
                        {passRate !== null && (
                          <span
                            className={`font-medium ${
                              passRate >= 80
                                ? "text-success"
                                : passRate >= 50
                                ? "text-warning"
                                : "text-destructive"
                            }`}
                          >
                            {passRate}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                      {total > 0 && (
                        <>
                          <div
                            className="h-2 bg-success transition-all"
                            style={{
                              width: `${
                                (week.passed / (total + week.done)) * 100
                              }%`,
                            }}
                          />
                          <div
                            className="h-2 bg-red-400 transition-all"
                            style={{
                              width: `${
                                (week.failed / (total + week.done)) * 100
                              }%`,
                            }}
                          />
                        </>
                      )}
                      {week.done > 0 && (
                        <div
                          className="h-2 bg-yellow-400 transition-all"
                          style={{
                            width: `${
                              (week.done / (total + week.done)) * 100
                            }%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Ad-hoc Tasks */}
      {completedAdhocTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Completed Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {completedAdhocTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {task.completed_at
                        ? new Date(task.completed_at).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : task.due_date}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="border-success/30 bg-success/10 text-success dark:bg-success/20"
                >
                  Done
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
              const sc = INSPECTION_STATUS[task.status] || INSPECTION_STATUS.done
              const StatusIcon = sc.icon!
              const roomName =
                (task.rooms as { name?: string; room_types?: { name?: string } } | null)?.name || "Unknown Room"
              const roomType =
                (task.rooms as { name?: string; room_types?: { name?: string } } | null)?.room_types?.name || ""
              const activityName =
                (task.cleaning_activities as { scheduled_date?: string; name?: string; floors?: { buildings?: { name?: string } } } | null)?.name || "Unknown Activity"
              const buildingName =
                (task.cleaning_activities as { scheduled_date?: string; name?: string; floors?: { buildings?: { name?: string } } } | null)?.floors?.buildings?.name || ""

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
