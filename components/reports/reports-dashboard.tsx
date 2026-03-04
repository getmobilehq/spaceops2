"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CalendarCheck,
  ClipboardCheck,
  TrendingUp,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart3,
  LineChart,
} from "lucide-react"
import { TrendChart } from "./trend-chart"
import { PassRateBar } from "./pass-rate-bar"
import { StatCard } from "@/components/shared/StatCard"
import { DonutChart } from "@/components/charts/donut-chart"
import { AreaTrendChart } from "@/components/charts/area-trend-chart"
import { ACTIVITY_STATUS } from "@/lib/status-styles"
import type { ReportFilters } from "@/lib/queries/reports"

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

interface Building {
  id: string
  name: string
}

function exportCsv(history: ActivityRow[]) {
  const headers = [
    "Activity",
    "Building",
    "Floor",
    "Date",
    "Status",
    "Total Rooms",
    "Completed",
    "Passed",
    "Failed",
    "Pass Rate",
  ]
  const rows = history.map((a) => [
    a.name,
    a.buildingName,
    a.floorName,
    a.scheduledDate,
    a.status,
    a.totalRooms,
    a.completedRooms,
    a.passedRooms,
    a.failedRooms,
    a.passRate !== null ? `${a.passRate}%` : "N/A",
  ])

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n")

  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `spacops-report-${new Date().toISOString().split("T")[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function DeltaBadge({
  current,
  previous,
  suffix = "",
  invertColor = false,
}: {
  current: number
  previous: number
  suffix?: string
  invertColor?: boolean
}) {
  const delta = current - previous
  if (delta === 0 || (previous === 0 && current === 0)) {
    return (
      <span className="inline-flex items-center text-xs text-muted-foreground">
        <Minus className="h-3 w-3 mr-0.5" />
        no change
      </span>
    )
  }
  const isUp = delta > 0
  const isGood = invertColor ? !isUp : isUp
  return (
    <span
      className={`inline-flex items-center text-xs font-medium ${
        isGood ? "text-success" : "text-destructive"
      }`}
    >
      {isUp ? (
        <ArrowUp className="h-3 w-3 mr-0.5" />
      ) : (
        <ArrowDown className="h-3 w-3 mr-0.5" />
      )}
      {Math.abs(delta)}
      {suffix} vs prev period
    </span>
  )
}

export function ReportsDashboard({
  summary,
  previousSummary,
  byBuilding,
  byJanitor,
  trend,
  history,
  deficiencies,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  orgSlug: _orgSlug,
  buildings,
  filters,
}: {
  summary: Summary
  previousSummary?: Summary
  byBuilding: ByBuilding[]
  byJanitor: ByJanitor[]
  trend: TrendPoint[]
  history: ActivityRow[]
  deficiencies: DeficiencyBreakdown
  orgSlug: string
  buildings: Building[]
  filters: ReportFilters
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [dateFrom, setDateFrom] = useState(filters.dateFrom || "")
  const [dateTo, setDateTo] = useState(filters.dateTo || "")
  const [buildingId, setBuildingId] = useState(filters.buildingId || "all")
  const [chartMode, setChartMode] = useState<"bar" | "area">("bar")

  function applyFilters() {
    const params = new URLSearchParams()
    if (dateFrom) params.set("dateFrom", dateFrom)
    if (dateTo) params.set("dateTo", dateTo)
    if (buildingId && buildingId !== "all") params.set("buildingId", buildingId)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  function clearFilters() {
    setDateFrom("")
    setDateTo("")
    setBuildingId("all")
    router.push(pathname)
  }

  const hasFilters = filters.dateFrom || filters.dateTo || filters.buildingId

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Performance metrics and inspection insights
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportCsv(history)}
          disabled={history.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFrom(e.target.value)}
                className="h-8 w-40 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateTo(e.target.value)}
                className="h-8 w-40 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Building</Label>
              <Select value={buildingId} onValueChange={setBuildingId}>
                <SelectTrigger className="h-8 w-48 text-sm">
                  <SelectValue placeholder="All buildings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All buildings</SelectItem>
                  {buildings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="h-8" onClick={applyFilters}>
              Apply
            </Button>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={clearFilters}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Overall Pass Rate"
          value={summary.passRate !== null ? `${summary.passRate}%` : "N/A"}
          icon={TrendingUp}
          iconClassName="bg-primary/10 text-primary"
          animationDelay="0ms"
          trend={
            previousSummary && summary.passRate !== null && previousSummary.passRate !== null
              ? {
                  value: `${summary.passRate - previousSummary.passRate >= 0 ? "+" : ""}${summary.passRate - previousSummary.passRate}% vs prev`,
                  positive: summary.passRate >= previousSummary.passRate,
                }
              : undefined
          }
        />
        <StatCard
          title="Total Activities"
          value={summary.totalActivities}
          icon={CalendarCheck}
          iconClassName="bg-info/10 text-info"
          animationDelay="100ms"
          trend={
            previousSummary
              ? {
                  value: `${summary.totalActivities - previousSummary.totalActivities >= 0 ? "+" : ""}${summary.totalActivities - previousSummary.totalActivities} vs prev`,
                  positive: summary.totalActivities >= previousSummary.totalActivities,
                }
              : undefined
          }
        />
        <Card className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Inspections</p>
              <p className="text-2xl font-bold">
                <span className="text-success">{summary.passedTasks}</span>
                {" / "}
                <span className="text-destructive">{summary.failedTasks}</span>
              </p>
              <p className="text-xs text-muted-foreground">passed / failed</p>
              {previousSummary && (
                <DeltaBadge
                  current={summary.passedTasks}
                  previous={previousSummary.passedTasks}
                  suffix=" passed"
                />
              )}
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
              <ClipboardCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <StatCard
          title="Open Issues"
          value={summary.openDeficiencies}
          icon={AlertTriangle}
          iconClassName="bg-destructive/10 text-destructive"
          animationDelay="300ms"
          trend={
            previousSummary
              ? {
                  value: `${summary.openDeficiencies - previousSummary.openDeficiencies >= 0 ? "+" : ""}${summary.openDeficiencies - previousSummary.openDeficiencies} vs prev`,
                  positive: summary.openDeficiencies <= previousSummary.openDeficiencies,
                }
              : undefined
          }
        />
      </div>

      {/* Trend chart */}
      {trend.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              Inspection Trend {hasFilters ? "(Filtered)" : "(Last 30 Days)"}
            </CardTitle>
            <div className="flex items-center gap-1 rounded-md border p-0.5">
              <button
                onClick={() => setChartMode("bar")}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  chartMode === "bar"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setChartMode("area")}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  chartMode === "area"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LineChart className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {chartMode === "bar" ? (
              <TrendChart data={trend} />
            ) : (
              <AreaTrendChart
                data={trend.map((d) => {
                  const total = d.passed + d.failed
                  return {
                    label: new Date(d.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    }),
                    value: total > 0 ? Math.round((d.passed / total) * 100) : 0,
                  }
                })}
                valueSuffix="%"
                color="hsl(var(--primary))"
              />
            )}
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

      {/* Deficiency breakdown — donut charts */}
      {deficiencies.total > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Issues by Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart
                data={[
                  { name: "High", value: deficiencies.bySeverity.high, color: "hsl(var(--destructive))" },
                  { name: "Medium", value: deficiencies.bySeverity.medium, color: "hsl(var(--warning))" },
                  { name: "Low", value: deficiencies.bySeverity.low, color: "hsl(var(--info))" },
                ]}
                centerLabel={deficiencies.total}
                centerSubLabel="total"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Issues by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart
                data={[
                  { name: "Open", value: deficiencies.byStatus.open, color: "hsl(var(--destructive))" },
                  { name: "In Progress", value: deficiencies.byStatus.in_progress, color: "hsl(var(--warning))" },
                  { name: "Resolved", value: deficiencies.byStatus.resolved, color: "hsl(var(--success))" },
                ]}
                centerLabel={deficiencies.total}
                centerSubLabel="total"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity history table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Activity History</CardTitle>
          {history.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {history.length} activities
            </span>
          )}
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
                      <CheckCircle2 className="inline h-3.5 w-3.5 text-success" />
                    </th>
                    <th className="pb-2 pr-4 font-medium text-center">
                      <XCircle className="inline h-3.5 w-3.5 text-destructive" />
                    </th>
                    <th className="pb-2 font-medium text-right">Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((a) => {
                    const sb = ACTIVITY_STATUS[a.status] || ACTIVITY_STATUS.draft
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
                        <td className="py-2.5 pr-4 text-center text-success">
                          {a.passedRooms}
                        </td>
                        <td className="py-2.5 pr-4 text-center text-destructive">
                          {a.failedRooms}
                        </td>
                        <td className="py-2.5 text-right font-medium">
                          {a.passRate !== null ? (
                            <span
                              className={
                                a.passRate >= 80
                                  ? "text-success"
                                  : a.passRate >= 50
                                  ? "text-warning"
                                  : "text-destructive"
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
