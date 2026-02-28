"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CalendarCheck,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react"
import { TrendChart } from "./trend-chart"
import { PassRateBar } from "./pass-rate-bar"

interface Summary {
  totalTasks: number
  passedTasks: number
  failedTasks: number
  inspectedTasks: number
  doneTasks: number
  inProgressTasks: number
  passRate: number | null
  totalActivities: number
  openDeficiencies: number
}

interface ByBuilding {
  name: string
  passed: number
  failed: number
  total: number
  passRate: number
}

interface ByJanitor {
  name: string
  passed: number
  failed: number
  total: number
  passRate: number
}

interface TrendPoint {
  date: string
  passed: number
  failed: number
  done: number
}

interface ActivityRow {
  id: string
  name: string
  status: string
  scheduledDate: string
  buildingName: string
  floorName: string
  totalRooms: number
  completedRooms: number
  passedRooms: number
  failedRooms: number
  passRate: number | null
}

interface DeficiencyBreakdown {
  total: number
  bySeverity: { low: number; medium: number; high: number }
  byStatus: { open: number; in_progress: number; resolved: number }
}

const statusBadge: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "border-gray-200 bg-gray-50 text-gray-700" },
  active: { label: "Active", className: "border-green-200 bg-green-50 text-green-700" },
  closed: { label: "Closed", className: "border-blue-200 bg-blue-50 text-blue-700" },
  cancelled: { label: "Cancelled", className: "border-red-200 bg-red-50 text-red-700" },
}

export function ReportsDashboard({
  summary,
  byBuilding,
  byJanitor,
  trend,
  history,
  deficiencies,
  orgSlug,
}: {
  summary: Summary
  byBuilding: ByBuilding[]
  byJanitor: ByJanitor[]
  trend: TrendPoint[]
  history: ActivityRow[]
  deficiencies: DeficiencyBreakdown
  orgSlug: string
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Performance metrics and inspection insights
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Pass Rate</p>
                <p className="text-2xl font-bold">
                  {summary.passRate !== null ? `${summary.passRate}%` : "N/A"}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Activities</p>
                <p className="text-2xl font-bold">{summary.totalActivities}</p>
              </div>
              <CalendarCheck className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inspections</p>
                <p className="text-2xl font-bold">
                  <span className="text-green-600">{summary.passedTasks}</span>
                  {" / "}
                  <span className="text-red-600">{summary.failedTasks}</span>
                </p>
                <p className="text-xs text-muted-foreground">passed / failed</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Deficiencies</p>
                <p className="text-2xl font-bold text-red-600">
                  {summary.openDeficiencies}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend chart */}
      {trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inspection Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={trend} />
          </CardContent>
        </Card>
      )}

      {/* Pass rates side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Building */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pass Rate by Building</CardTitle>
          </CardHeader>
          <CardContent>
            {byBuilding.length === 0 ? (
              <p className="text-sm text-muted-foreground">No inspection data yet.</p>
            ) : (
              <div className="space-y-3">
                {byBuilding.map((b) => (
                  <PassRateBar
                    key={b.name}
                    label={b.name}
                    passed={b.passed}
                    failed={b.failed}
                    passRate={b.passRate}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Janitor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pass Rate by Janitor</CardTitle>
          </CardHeader>
          <CardContent>
            {byJanitor.length === 0 ? (
              <p className="text-sm text-muted-foreground">No inspection data yet.</p>
            ) : (
              <div className="space-y-3">
                {byJanitor.map((j) => (
                  <PassRateBar
                    key={j.name}
                    label={j.name}
                    passed={j.passed}
                    failed={j.failed}
                    passRate={j.passRate}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deficiency breakdown */}
      {deficiencies.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deficiency Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  By Severity
                </p>
                <div className="space-y-2">
                  {(
                    [
                      { key: "high", label: "High", className: "border-red-200 bg-red-50 text-red-700" },
                      { key: "medium", label: "Medium", className: "border-yellow-200 bg-yellow-50 text-yellow-700" },
                      { key: "low", label: "Low", className: "border-blue-200 bg-blue-50 text-blue-700" },
                    ] as const
                  ).map((s) => (
                    <div key={s.key} className="flex items-center justify-between">
                      <Badge variant="outline" className={s.className}>
                        {s.label}
                      </Badge>
                      <span className="text-sm font-medium">
                        {deficiencies.bySeverity[s.key]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  By Status
                </p>
                <div className="space-y-2">
                  {(
                    [
                      { key: "open", label: "Open", className: "border-red-200 bg-red-50 text-red-700" },
                      { key: "in_progress", label: "In Progress", className: "border-yellow-200 bg-yellow-50 text-yellow-700" },
                      { key: "resolved", label: "Resolved", className: "border-green-200 bg-green-50 text-green-700" },
                    ] as const
                  ).map((s) => (
                    <div key={s.key} className="flex items-center justify-between">
                      <Badge variant="outline" className={s.className}>
                        {s.label}
                      </Badge>
                      <span className="text-sm font-medium">
                        {deficiencies.byStatus[s.key]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity history table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activities yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Activity</th>
                    <th className="pb-2 pr-4 font-medium">Building</th>
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium text-center">Rooms</th>
                    <th className="pb-2 pr-4 font-medium text-center">
                      <CheckCircle2 className="inline h-3.5 w-3.5 text-green-600" />
                    </th>
                    <th className="pb-2 pr-4 font-medium text-center">
                      <XCircle className="inline h-3.5 w-3.5 text-red-600" />
                    </th>
                    <th className="pb-2 font-medium text-right">Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((a) => {
                    const sb = statusBadge[a.status] || statusBadge.draft
                    return (
                      <tr key={a.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 font-medium">{a.name}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {a.buildingName}
                          <span className="text-xs"> · {a.floorName}</span>
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {new Date(a.scheduledDate).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge variant="outline" className={sb.className}>
                            {sb.label}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4 text-center">
                          {a.completedRooms}/{a.totalRooms}
                        </td>
                        <td className="py-2.5 pr-4 text-center text-green-600">
                          {a.passedRooms}
                        </td>
                        <td className="py-2.5 pr-4 text-center text-red-600">
                          {a.failedRooms}
                        </td>
                        <td className="py-2.5 text-right font-medium">
                          {a.passRate !== null ? (
                            <span
                              className={
                                a.passRate >= 80
                                  ? "text-green-600"
                                  : a.passRate >= 50
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }
                            >
                              {a.passRate}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
