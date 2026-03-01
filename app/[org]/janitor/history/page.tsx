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
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  Flame,
  BarChart3,
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

  const [tasks, perfStats, perfTrend] = await Promise.all([
    getJanitorTaskHistory(supabase, user.id),
    getJanitorPerformanceStats(supabase, user.id),
    getJanitorPerformanceTrend(supabase, user.id),
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
        <h1 className="text-2xl font-bold text-brand">Task History</h1>
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
                      ? "text-green-600"
                      : perfStats.passRate >= 50
                      ? "text-yellow-600"
                      : "text-red-600"
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
              <span className="text-green-600">{perfStats.passed}</span>
              {" / "}
              <span className="text-red-600">{perfStats.failed}</span>
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
                        <span className="text-green-600">
                          {week.passed} passed
                        </span>
                        {week.failed > 0 && (
                          <span className="text-red-600">
                            {week.failed} failed
                          </span>
                        )}
                        {week.done > 0 && (
                          <span className="text-yellow-600">
                            {week.done} awaiting
                          </span>
                        )}
                        {passRate !== null && (
                          <span
                            className={`font-medium ${
                              passRate >= 80
                                ? "text-green-600"
                                : passRate >= 50
                                ? "text-yellow-600"
                                : "text-red-600"
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
                            className="h-2 bg-green-500 transition-all"
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
