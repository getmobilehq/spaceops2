import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getJanitorTodayTasks } from "@/lib/queries/activities"
import { getJanitorTodayAttendance } from "@/lib/queries/attendance"
import { getJanitorTodayAdhocTasks } from "@/lib/queries/adhoc-tasks"
import { Clock, MapPin, ChevronRight, QrCode, ListTodo } from "lucide-react"
import { RealtimeListener } from "@/components/shared/RealtimeListener"
import { AttendanceBanner } from "./attendance-banner"
import { getTranslations } from "@/lib/i18n/server"
import type { DictionaryKey } from "@/lib/i18n/get-dictionary"

export const metadata = {
  title: "Today - SpaceOps",
}

const taskStatusClassNames: Record<string, string> = {
  not_started: "border-muted-foreground/30 bg-muted text-muted-foreground",
  in_progress: "border-warning/30 bg-warning/10 text-warning dark:bg-warning/20",
  done: "border-success/30 bg-success/10 text-success dark:bg-success/20",
  has_issues: "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
}

const taskStatusKeys: Record<string, DictionaryKey> = {
  not_started: "taskStatus.notStarted",
  in_progress: "taskStatus.inProgress",
  done: "taskStatus.done",
  has_issues: "taskStatus.hasIssues",
}

export default async function JanitorTodayPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [tasks, attendance, adhocTasks, { t }] = await Promise.all([
    user ? getJanitorTodayTasks(supabase, user.id) : Promise.resolve([]),
    user ? getJanitorTodayAttendance(supabase, user.id) : Promise.resolve([]),
    user ? getJanitorTodayAdhocTasks(supabase, user.id) : Promise.resolve([]),
    getTranslations(),
  ])

  // Group tasks by activity
  const grouped = new Map<
    string,
    {
      activityName: string
      windowStart: string
      windowEnd: string
      floorName: string
      buildingName: string
      tasks: typeof tasks
    }
  >()

  for (const task of tasks) {
    const activity = task.cleaning_activities
    if (!activity) continue
    const key = task.activity_id

    if (!grouped.has(key)) {
      grouped.set(key, {
        activityName: activity.name,
        windowStart: activity.window_start,
        windowEnd: activity.window_end,
        floorName: activity.floors?.floor_name || "",
        buildingName: activity.floors?.buildings?.name || "",
        tasks: [],
      })
    }
    grouped.get(key)!.tasks.push(task)
  }

  return (
    <div className="space-y-4">
      <RealtimeListener table="room_tasks" />
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("janitor.today.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {user?.user_metadata?.first_name || "Welcome"}
        </p>
      </div>

      {/* Attendance Banner */}
      <AttendanceBanner
        attendance={attendance as { id: string; clock_in_at: string; clock_out_at: string | null; geo_verified: boolean; buildings: { name: string } | null }[]}
        hasTasks={tasks.length > 0}
      />

      {tasks.length === 0 && adhocTasks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("janitor.today.assignedRooms")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {t("janitor.today.noRooms")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
        {Array.from(grouped.entries()).map(([activityId, group]) => (
          <Card key={activityId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{group.activityName}</CardTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {group.buildingName} · {group.floorName}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {group.windowStart.slice(0, 5)} – {group.windowEnd.slice(0, 5)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {group.tasks.map((task) => {
                const statusClassName =
                  taskStatusClassNames[task.status] || taskStatusClassNames.not_started
                const statusLabel =
                  t(taskStatusKeys[task.status] || taskStatusKeys.not_started)
                const needsCheckIn =
                  !task.checked_in_at &&
                  (task.status === "not_started" || task.status === "in_progress")
                return (
                  <Link
                    key={task.id}
                    href={`/${params.org}/janitor/task/${task.id}`}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {task.rooms?.name || t("janitor.today.unknownRoom")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {task.rooms?.room_types?.name || ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {needsCheckIn && (
                        <Badge
                          variant="outline"
                          className="border-warning/30 bg-warning/10 text-warning dark:bg-warning/20 text-[10px] px-1.5 gap-1"
                        >
                          <QrCode className="h-3 w-3" />
                          {t("janitor.today.scanToStart")}
                        </Badge>
                      )}
                      <Badge variant="outline" className={statusClassName}>
                        {statusLabel}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        ))}

        {/* Ad-hoc Tasks */}
        {adhocTasks.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {adhocTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/${params.org}/janitor/task/adhoc/${task.id}`}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    {task.due_time && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due by {task.due_time.slice(0, 5)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-warning/30 bg-warning/10 text-warning dark:bg-warning/20"
                    >
                      Pending
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
        </>
      )}
    </div>
  )
}
