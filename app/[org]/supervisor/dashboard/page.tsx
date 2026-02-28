import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CalendarCheck,
  ClipboardCheck,
  AlertTriangle,
  MapPin,
  Clock,
} from "lucide-react"
import { getSupervisorBuildings } from "@/lib/queries/activities"
import {
  getSupervisorDashboardStats,
  getTodayActivityDetails,
} from "@/lib/queries/dashboard"
import { ActivityStatusBadge } from "@/components/shared/ActivityStatusBadge"

export const metadata = {
  title: "Supervisor Dashboard - SpaceOps",
}

export default async function SupervisorDashboardPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [stats, todayActivities, buildings] = await Promise.all([
    getSupervisorDashboardStats(supabase),
    getTodayActivityDetails(supabase),
    user ? getSupervisorBuildings(supabase, user.id) : [],
  ])

  const activeCount = todayActivities.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">
          Supervisor Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome, {user?.user_metadata?.first_name || user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href={`/${params.org}/supervisor/activities`}>
          <Card className="hover:bg-muted transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Today&apos;s Activities
                  </p>
                  <p className="text-3xl font-bold text-brand">{activeCount}</p>
                </div>
                <CalendarCheck className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Pending Inspection
                </p>
                <p className={`text-3xl font-bold ${stats.pendingInspection > 0 ? "text-yellow-600" : "text-brand"}`}>
                  {stats.pendingInspection}
                </p>
              </div>
              <ClipboardCheck className={`h-8 w-8 ${stats.pendingInspection > 0 ? "text-yellow-200" : "text-muted-foreground/50"}`} />
            </div>
          </CardContent>
        </Card>
        <Link href={`/${params.org}/supervisor/deficiencies`}>
          <Card className="hover:bg-muted transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Issues</p>
                  <p className={`text-3xl font-bold ${stats.openIssues > 0 ? "text-red-600" : "text-brand"}`}>
                    {stats.openIssues}
                  </p>
                </div>
                <AlertTriangle className={`h-8 w-8 ${stats.openIssues > 0 ? "text-red-200" : "text-muted-foreground/50"}`} />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Today's Activity Cards */}
      {todayActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today&apos;s Activities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayActivities.map((a) => {
              const progress =
                a.totalRooms > 0
                  ? Math.round((a.completedRooms / a.totalRooms) * 100)
                  : 0

              return (
                <Link
                  key={a.id}
                  href={`/${params.org}/supervisor/activities/${a.id}`}
                  className="block rounded-md border p-4 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{a.name}</p>
                        <ActivityStatusBadge status={a.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {a.building} · {a.floor}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {a.windowStart.slice(0, 5)} – {a.windowEnd.slice(0, 5)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {a.completedRooms}/{a.totalRooms}
                      </p>
                      <p className="text-xs text-muted-foreground">rooms done</p>
                    </div>
                  </div>
                  {a.totalRooms > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-1.5 bg-brand transition-all rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {a.pendingInspection > 0 && (
                        <p className="text-xs text-yellow-600 mt-1">
                          {a.pendingInspection} room{a.pendingInspection !== 1 ? "s" : ""} pending inspection
                        </p>
                      )}
                    </div>
                  )}
                </Link>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Assigned Buildings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assigned Buildings</CardTitle>
        </CardHeader>
        <CardContent>
          {buildings.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No buildings assigned yet. Buildings will be assigned by your admin.
            </p>
          ) : (
            <div className="space-y-2">
              {buildings.map((b) =>
                b ? (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.address}
                      </p>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
