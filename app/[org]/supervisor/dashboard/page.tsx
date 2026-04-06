import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  CalendarCheck,
  ClipboardCheck,
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle2,
  Users as UsersIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getSupervisorBuildings } from "@/lib/queries/activities"
import {
  getSupervisorDashboardStats,
  getTodayActivityDetails,
} from "@/lib/queries/dashboard"
import { getSupervisorBuildingAttendance } from "@/lib/queries/attendance"
import { getInspectionStats } from "@/lib/queries/inspections"
import { ActivityStatusBadge } from "@/components/shared/ActivityStatusBadge"
import { StatCard } from "@/components/shared/StatCard"
import { getTranslations } from "@/lib/i18n/server"

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

  const [stats, todayActivities, buildings, inspectionStats, { t }] = await Promise.all([
    getSupervisorDashboardStats(supabase),
    getTodayActivityDetails(supabase),
    user ? getSupervisorBuildings(supabase, user.id) : [],
    user ? getInspectionStats(supabase, user.id) : { total: 0, pending: 0, passed: 0, failed: 0 },
    getTranslations(),
  ])
  const attendanceRecords = user ? await getSupervisorBuildingAttendance(supabase, user.id) : []

  const activeCount = todayActivities.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t("supervisor.dashboard.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("common.welcome", { name: user?.user_metadata?.first_name || user?.email || "" })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href={`/${params.org}/supervisor/activities`}>
          <StatCard
            title={t("supervisor.dashboard.todaysActivities")}
            value={activeCount}
            icon={CalendarCheck}
            iconClassName="bg-primary/10 text-primary"
            className="hover:bg-muted/50 transition-colors"
            animationDelay="0ms"
          />
        </Link>
        <Link href={`/${params.org}/supervisor/inspections`}>
          <StatCard
            title={t("supervisor.dashboard.inspections")}
            value={inspectionStats.total}
            icon={ClipboardCheck}
            iconClassName={
              inspectionStats.pending > 0
                ? "bg-warning/10 text-warning"
                : "bg-primary/10 text-primary"
            }
            className="hover:bg-muted/50 transition-colors"
            animationDelay="100ms"
          />
        </Link>
        <Link href={`/${params.org}/supervisor/issues`}>
          <StatCard
            title={t("supervisor.dashboard.openIssues")}
            value={stats.openIssues}
            icon={AlertTriangle}
            iconClassName={
              stats.openIssues > 0
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
            }
            className="hover:bg-muted/50 transition-colors"
            animationDelay="200ms"
          />
        </Link>
      </div>

      {/* Today's Activity Cards */}
      {todayActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("supervisor.dashboard.todaysActivities")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayActivities.map((a, i) => {
              const progress =
                a.totalRooms > 0
                  ? Math.round((a.completedRooms / a.totalRooms) * 100)
                  : 0

              return (
                <Link
                  key={a.id}
                  href={`/${params.org}/supervisor/activities/${a.id}`}
                  className="block rounded-md border p-4 hover:bg-muted/50 transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
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
                      <p className="text-xs text-muted-foreground">{t("supervisor.dashboard.roomsDone")}</p>
                    </div>
                  </div>
                  {a.totalRooms > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-1.5 bg-primary transition-all rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {a.pendingInspection > 0 && (
                        <p className="text-xs text-warning mt-1">
                          {a.pendingInspection === 1
                            ? t("supervisor.dashboard.pendingInspection", { count: a.pendingInspection })
                            : t("supervisor.dashboard.pendingInspectionPlural", { count: a.pendingInspection })}
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

      {/* Attendance Today */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t("supervisor.dashboard.attendanceToday")}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              <UsersIcon className="mr-1 h-3 w-3" />
              {t("common.clockedIn", { count: attendanceRecords.length })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("supervisor.dashboard.noClockIns")}
            </p>
          ) : (
            <div className="space-y-2">
              {attendanceRecords.map((record) => {
                const u = record.users as { id: string; first_name: string; last_name: string } | null
                const b = record.buildings as { name: string } | null
                const clockIn = new Date(record.clock_in_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {u ? `${u.first_name} ${u.last_name}` : "Unknown"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {b?.name || t("supervisor.dashboard.unknownBuilding")}
                        <span>·</span>
                        <Clock className="h-3 w-3" />
                        {clockIn}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        record.geo_verified
                          ? "border-success/30 bg-success/10 text-success dark:bg-success/20"
                          : "border-warning/30 bg-warning/10 text-warning dark:bg-warning/20"
                      }
                    >
                      {record.geo_verified ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : (
                        <AlertTriangle className="mr-1 h-3 w-3" />
                      )}
                      {record.geo_verified ? t("supervisor.dashboard.verified") : t("supervisor.dashboard.unverified")}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned Buildings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("supervisor.dashboard.assignedBuildings")}</CardTitle>
        </CardHeader>
        <CardContent>
          {buildings.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("supervisor.dashboard.noBuildingsAssigned")}
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
