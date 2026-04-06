"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CalendarCheck,
  BarChart3,
  Layers,
  DoorOpen,
  ShieldCheck,
  Clock,
  Target,
} from "lucide-react"
import { StatCard } from "@/components/shared/StatCard"
import { ACTIVITY_STATUS } from "@/lib/status-styles"
import { useTranslation } from "@/lib/i18n/client"

interface Building {
  id: string
  name: string
  address: string
  status: string
  floorCount: number
  roomCount: number
}

interface Activity {
  id: string
  name: string
  status: string
  scheduledDate: string
  windowStart: string
  windowEnd: string
  buildingName: string
  floorName: string
  totalRooms: number
  completedRooms: number
  passedRooms: number
  failedRooms: number
  passRate: number | null
}

interface Stats {
  totalActivities: number
  totalTasks: number
  passedTasks: number
  failedTasks: number
  overallPassRate: number | null
  openDeficiencies: number
}

interface SLAMetrics {
  passRateTarget: number
  passRateCompliance: number | null
  avgCompletionRate: number | null
  avgResolutionHours: number | null
  deficiencySLA: { onTrack: number; atRisk: number; breached: number }
  totalActivitiesAnalysed: number
}

export function ClientDashboard({
  buildings,
  activities,
  stats,
  sla,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  orgSlug,
}: {
  buildings: Building[]
  activities: Activity[]
  stats: Stats
  sla: SLAMetrics
  orgSlug: string
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t("client.overview.title")}</h1>
        <p className="text-muted-foreground">
          {t("client.overview.subtitle")}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("client.overview.activities")}
          value={stats.totalActivities}
          icon={CalendarCheck}
          iconClassName="bg-primary/10 text-primary"
          animationDelay="0ms"
        />
        <StatCard
          title={t("client.overview.passRate")}
          value={stats.overallPassRate !== null ? `${stats.overallPassRate}%` : t("common.na")}
          icon={BarChart3}
          iconClassName="bg-info/10 text-info"
          animationDelay="100ms"
        />
        <StatCard
          title={t("client.overview.inspectionsPassed")}
          value={stats.passedTasks}
          icon={CheckCircle2}
          iconClassName="bg-success/10 text-success"
          animationDelay="200ms"
        />
        <StatCard
          title={t("client.overview.openIssues")}
          value={stats.openDeficiencies}
          icon={AlertTriangle}
          iconClassName="bg-destructive/10 text-destructive"
          animationDelay="300ms"
        />
      </div>

      {/* SLA Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {t("client.overview.sla")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Pass Rate Compliance */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4 text-muted-foreground" />
                {t("client.overview.passRateCompliance")}
              </div>
              <div className="text-2xl font-bold">
                {sla.passRateCompliance !== null ? (
                  <span
                    className={
                      sla.passRateCompliance >= 80
                        ? "text-success"
                        : sla.passRateCompliance >= 50
                        ? "text-warning"
                        : "text-destructive"
                    }
                  >
                    {sla.passRateCompliance}%
                  </span>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("client.overview.passRateTarget", { target: sla.passRateTarget })}
              </p>
            </div>

            {/* Avg Completion Rate */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                {t("client.overview.avgCompletionRate")}
              </div>
              <div className="text-2xl font-bold">
                {sla.avgCompletionRate !== null ? (
                  <span
                    className={
                      sla.avgCompletionRate >= 95
                        ? "text-success"
                        : sla.avgCompletionRate >= 80
                        ? "text-warning"
                        : "text-destructive"
                    }
                  >
                    {sla.avgCompletionRate}%
                  </span>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("client.overview.roomsCleanedPerActivity")}
              </p>
            </div>

            {/* Avg Resolution Time */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {t("client.overview.avgResolutionTime")}
              </div>
              <div className="text-2xl font-bold">
                {sla.avgResolutionHours !== null ? (
                  <span
                    className={
                      sla.avgResolutionHours <= 24
                        ? "text-success"
                        : sla.avgResolutionHours <= 48
                        ? "text-warning"
                        : "text-destructive"
                    }
                  >
                    {sla.avgResolutionHours}h
                  </span>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("client.overview.issueResolutionTime")}
              </p>
            </div>
          </div>

          {/* Deficiency SLA status */}
          {(sla.deficiencySLA.onTrack > 0 ||
            sla.deficiencySLA.atRisk > 0 ||
            sla.deficiencySLA.breached > 0) && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">{t("client.overview.issueSlaStatus")}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  <span className="text-sm">
                    {t("common.onTrack", { count: sla.deficiencySLA.onTrack })}
                  </span>
                </div>
                {sla.deficiencySLA.atRisk > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-warning" />
                    <span className="text-sm">
                      {t("common.atRisk", { count: sla.deficiencySLA.atRisk })}
                    </span>
                  </div>
                )}
                {sla.deficiencySLA.breached > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-destructive" />
                    <span className="text-sm">
                      {t("common.breached", { count: sla.deficiencySLA.breached })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Buildings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("client.overview.yourBuildings")}</CardTitle>
        </CardHeader>
        <CardContent>
          {buildings.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("client.overview.noBuildingsConfigured")}
            </p>
          ) : (
            <div className="space-y-3">
              {buildings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {t("common.floors", { count: b.floorCount })}
                    </span>
                    <span className="flex items-center gap-1">
                      <DoorOpen className="h-3 w-3" />
                      {t("common.rooms", { count: b.roomCount })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent activities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("client.overview.recentActivities")}</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("client.overview.noActivities")}
            </p>
          ) : (
            <div className="space-y-3">
              {activities.map((a, i) => {
                const config = ACTIVITY_STATUS[a.status] || ACTIVITY_STATUS.draft
                return (
                  <div
                    key={a.id}
                    className="rounded-md border p-3 space-y-2 animate-fade-in-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{a.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.buildingName} · {a.floorName} ·{" "}
                          {new Date(a.scheduledDate).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge variant="outline" className={config.className}>
                        {config.label}
                      </Badge>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {a.completedRooms}/{a.totalRooms} {t("common.roomsDone")}
                        </span>
                        {a.passRate !== null && (
                          <span
                            className={
                              a.passRate >= 80
                                ? "text-success"
                                : a.passRate >= 50
                                ? "text-warning"
                                : "text-destructive"
                            }
                          >
                            {t("common.passRate", { rate: a.passRate })}
                          </span>
                        )}
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                        {a.totalRooms > 0 && (
                          <>
                            <div
                              className="h-2 bg-success animate-expand-width"
                              style={{
                                width: `${(a.passedRooms / a.totalRooms) * 100}%`,
                                animationDelay: "0.2s",
                              }}
                            />
                            <div
                              className="h-2 bg-destructive animate-expand-width"
                              style={{
                                width: `${(a.failedRooms / a.totalRooms) * 100}%`,
                                animationDelay: "0.4s",
                              }}
                            />
                            <div
                              className="h-2 bg-warning animate-expand-width"
                              style={{
                                width: `${
                                  ((a.completedRooms - a.passedRooms - a.failedRooms) /
                                    a.totalRooms) *
                                  100
                                }%`,
                                animationDelay: "0.6s",
                              }}
                            />
                          </>
                        )}
                      </div>
                      {(a.passedRooms > 0 || a.failedRooms > 0) && (
                        <div className="flex items-center gap-3 text-xs">
                          {a.passedRooms > 0 && (
                            <span className="flex items-center gap-1 text-success">
                              <CheckCircle2 className="h-3 w-3" />
                              {t("common.passed", { count: a.passedRooms })}
                            </span>
                          )}
                          {a.failedRooms > 0 && (
                            <span className="flex items-center gap-1 text-destructive">
                              <XCircle className="h-3 w-3" />
                              {t("common.failed", { count: a.failedRooms })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
