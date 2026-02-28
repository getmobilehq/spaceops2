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
import { Clock, MapPin, ChevronRight } from "lucide-react"
import { RealtimeListener } from "@/components/shared/RealtimeListener"

export const metadata = {
  title: "Today - SpaceOps",
}

const taskStatusConfig: Record<string, { label: string; className: string }> = {
  not_started: { label: "Not Started", className: "border-gray-200 bg-gray-50 text-gray-700" },
  in_progress: { label: "In Progress", className: "border-yellow-200 bg-yellow-50 text-yellow-700" },
  done: { label: "Done", className: "border-green-200 bg-green-50 text-green-700" },
  has_issues: { label: "Has Issues", className: "border-red-200 bg-red-50 text-red-700" },
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

  const tasks = user ? await getJanitorTodayTasks(supabase, user.id) : []

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
        <h1 className="text-xl font-bold text-brand">Today</h1>
        <p className="text-muted-foreground text-sm">
          {user?.user_metadata?.first_name || "Welcome"}
        </p>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assigned Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              No rooms assigned for today. Check back when your supervisor
              creates an activity.
            </p>
          </CardContent>
        </Card>
      ) : (
        Array.from(grouped.entries()).map(([activityId, group]) => (
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
                const statusConf =
                  taskStatusConfig[task.status] || taskStatusConfig.not_started
                return (
                  <Link
                    key={task.id}
                    href={`/${params.org}/janitor/task/${task.id}`}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {task.rooms?.name || "Unknown Room"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {task.rooms?.room_types?.name || ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusConf.className}>
                        {statusConf.label}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
