import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getClientRecentActivities } from "@/lib/queries/client-dashboard"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { CalendarDays, CheckCircle2, XCircle } from "lucide-react"

export const metadata = {
  title: "Activities - SpaceOps",
}

const statusBadge: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "border-success/30 bg-success/10 text-success dark:bg-success/20" },
  closed: { label: "Completed", className: "border-info/30 bg-info/10 text-info dark:bg-info/20" },
}

export default async function ClientActivitiesPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()
  const role = user.app_metadata?.role as string | undefined
  if (role !== "client") return notFound()

  const activities = await getClientRecentActivities(supabase, 50)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Activities</h1>
        <p className="text-muted-foreground">
          Cleaning activity history for your buildings
        </p>
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No activities yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activities.map((a) => {
            const sb = statusBadge[a.status] || statusBadge.active
            const progressPct =
              a.totalRooms > 0
                ? Math.round((a.completedRooms / a.totalRooms) * 100)
                : 0
            const passedPct =
              a.totalRooms > 0
                ? Math.round((a.passedRooms / a.totalRooms) * 100)
                : 0
            const failedPct =
              a.totalRooms > 0
                ? Math.round((a.failedRooms / a.totalRooms) * 100)
                : 0

            return (
              <Card key={a.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.buildingName} · {a.floorName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(a.scheduledDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                      <Badge variant="outline" className={sb.className}>
                        {sb.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                      {passedPct > 0 && (
                        <div
                          className="h-full bg-success"
                          style={{ width: `${passedPct}%` }}
                        />
                      )}
                      {failedPct > 0 && (
                        <div
                          className="h-full bg-destructive"
                          style={{ width: `${failedPct}%` }}
                        />
                      )}
                      {progressPct - passedPct - failedPct > 0 && (
                        <div
                          className="h-full bg-warning"
                          style={{
                            width: `${progressPct - passedPct - failedPct}%`,
                          }}
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{a.completedRooms}/{a.totalRooms} rooms</span>
                      <div className="flex items-center gap-3">
                        {a.passedRooms > 0 && (
                          <span className="flex items-center gap-1 text-success">
                            <CheckCircle2 className="h-3 w-3" />
                            {a.passedRooms}
                          </span>
                        )}
                        {a.failedRooms > 0 && (
                          <span className="flex items-center gap-1 text-destructive">
                            <XCircle className="h-3 w-3" />
                            {a.failedRooms}
                          </span>
                        )}
                        {a.passRate !== null && (
                          <span
                            className={
                              a.passRate >= 80
                                ? "font-medium text-success"
                                : a.passRate >= 50
                                ? "font-medium text-warning"
                                : "font-medium text-destructive"
                            }
                          >
                            {a.passRate}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
