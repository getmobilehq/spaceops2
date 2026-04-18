"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PassRateBar } from "./pass-rate-bar"
import { DonutChart } from "@/components/charts/donut-chart"
import {
  ArrowLeft,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import type { ReportData } from "./report-types"

const SEVERITY_COLORS: Record<string, string> = {
  high: "text-destructive",
  medium: "text-warning",
  low: "text-info",
}

export function ReportPreview({ data }: { data: ReportData }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const pathname = usePathname()
  const reportsPath = pathname.replace("/generate", "")

  const dateRange =
    data.filters.dateFrom && data.filters.dateTo
      ? `${data.filters.dateFrom} to ${data.filters.dateTo}`
      : data.filters.dateFrom
      ? `From ${data.filters.dateFrom}`
      : "All Time"

  async function handleDownload() {
    setIsGenerating(true)
    try {
      const { pdf } = await import("@react-pdf/renderer")
      const { ReportPDF } = await import("./report-pdf")
      const blob = await pdf(<ReportPDF data={data} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${data.orgName.replace(/\s+/g, "-").toLowerCase()}-report-${new Date().toISOString().split("T")[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("PDF generation failed:", err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <Link href={reportsPath}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </Link>
        <Button onClick={handleDownload} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      {/* === COVER === */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-12 text-center">
          <div className="w-16 h-1 bg-primary mx-auto mb-6" />
          <p className="text-primary font-semibold text-lg mb-2">{data.orgName}</p>
          <h1 className="text-3xl font-bold text-foreground mb-2">Operations Performance Report</h1>
          <p className="text-muted-foreground">{dateRange}</p>
          <div className="mt-8 text-sm text-muted-foreground">
            <p>{data.buildingCount} Buildings · {data.clientCount} Clients · {data.floorCount} Floors</p>
            <p className="mt-1">
              Generated {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </Card>

      {/* === EXECUTIVE SUMMARY === */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Executive Summary</CardTitle>
          <p className="text-xs text-muted-foreground">AI-generated analysis of operational performance</p>
        </CardHeader>
        <CardContent>
          {data.executiveSummary.split("\n\n").map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed text-foreground mb-4 last:mb-0">
              {paragraph}
            </p>
          ))}
        </CardContent>
      </Card>

      {/* === KPI DASHBOARD === */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-2xl font-bold text-primary">
                {data.summary.passRate !== null ? `${data.summary.passRate}%` : "N/A"}
              </p>
              <p className="text-xs text-muted-foreground">Overall Pass Rate</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-2xl font-bold text-info">{data.summary.totalActivities}</p>
              <p className="text-xs text-muted-foreground">Total Activities</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-2xl font-bold">
                <span className="text-success">{data.summary.passedTasks}</span>
                <span className="text-muted-foreground"> / </span>
                <span className="text-destructive">{data.summary.failedTasks}</span>
              </p>
              <p className="text-xs text-muted-foreground">Passed / Failed</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-2xl font-bold text-destructive">{data.summary.openDeficiencies}</p>
              <p className="text-xs text-muted-foreground">Open Deficiencies</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === BUILDING PERFORMANCE === */}
      {data.byBuilding.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Building Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.byBuilding.map((b) => (
              <PassRateBar key={b.name} label={b.name} passed={b.passed} failed={b.failed} passRate={b.passRate} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* === CLIENT PERFORMANCE === */}
      {data.byClient.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Client Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.byClient.map((c) => (
              <PassRateBar key={c.name} label={c.name} passed={c.passed} failed={c.failed} passRate={c.passRate} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* === FLOOR ANALYSIS === */}
      {data.byFloor.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Floor Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.byFloor.map((f) => (
              <PassRateBar
                key={`${f.buildingName}-${f.name}`}
                label={`${f.name} (${f.buildingName})`}
                passed={f.passed}
                failed={f.failed}
                passRate={f.passRate}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* === FLOOR PLANS === */}
      {data.floorPlans.map((fp) => (
        <Card key={fp.floorId}>
          <CardHeader>
            <CardTitle className="text-lg">{fp.buildingName} — {fp.floorName}</CardTitle>
            <p className="text-xs text-muted-foreground">{fp.roomCount} rooms</p>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden bg-muted" style={{ aspectRatio: "4/3" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fp.imageUrl}
                alt={`Floor plan for ${fp.floorName}`}
                className="w-full h-full object-contain"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* === ISSUES === */}
      {(data.deficiencies.total > 0 || data.issues.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Issues & Deficiencies</CardTitle>
          </CardHeader>
          <CardContent>
            {data.deficiencies.total > 0 && (
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm font-medium mb-2">By Severity</p>
                  <DonutChart
                    data={[
                      { name: "High", value: data.deficiencies.bySeverity.high, color: "hsl(var(--destructive))" },
                      { name: "Medium", value: data.deficiencies.bySeverity.medium, color: "hsl(var(--warning))" },
                      { name: "Low", value: data.deficiencies.bySeverity.low, color: "hsl(var(--info))" },
                    ]}
                    centerLabel={data.deficiencies.total}
                    centerSubLabel="total"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">By Status</p>
                  <DonutChart
                    data={[
                      { name: "Open", value: data.deficiencies.byStatus.open, color: "hsl(var(--destructive))" },
                      { name: "In Progress", value: data.deficiencies.byStatus.in_progress, color: "hsl(var(--warning))" },
                      { name: "Resolved", value: data.deficiencies.byStatus.resolved, color: "hsl(var(--success))" },
                    ]}
                    centerLabel={data.deficiencies.total}
                    centerSubLabel="total"
                  />
                </div>
              </div>
            )}

            {data.issues.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Description</th>
                      <th className="pb-2 pr-4 font-medium">Severity</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 pr-4 font-medium">Building</th>
                      <th className="pb-2 pr-4 font-medium">Floor</th>
                      <th className="pb-2 pr-4 font-medium">Room</th>
                      <th className="pb-2 font-medium">Reporter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.issues.map((issue) => (
                      <tr key={issue.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium max-w-[200px] truncate">{issue.description}</td>
                        <td className="py-2 pr-4">
                          <span className={`font-medium capitalize ${SEVERITY_COLORS[issue.severity] || ""}`}>
                            {issue.severity}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant="outline" className="capitalize">{issue.status.replace("_", " ")}</Badge>
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">{issue.buildingName}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{issue.floorName}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{issue.roomName}</td>
                        <td className="py-2 text-muted-foreground">{issue.reporterName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* === STAFF HOURS === */}
      {data.timeWorkedByJanitor.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Staff Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Staff Member</th>
                    <th className="pb-2 pr-4 font-medium text-right">Hours Worked</th>
                    <th className="pb-2 pr-4 font-medium text-right">Shifts</th>
                    <th className="pb-2 font-medium text-right">Avg Hours / Shift</th>
                  </tr>
                </thead>
                <tbody>
                  {data.timeWorkedByJanitor.map((tw) => (
                    <tr key={tw.name} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{tw.name}</td>
                      <td className="py-2 pr-4 text-right">{tw.hoursWorked}</td>
                      <td className="py-2 pr-4 text-right">{tw.shifts}</td>
                      <td className="py-2 text-right">{tw.avgShiftHours}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-medium">
                    <td className="pt-2 pr-4">Total</td>
                    <td className="pt-2 pr-4 text-right">
                      {data.timeWorkedByJanitor.reduce((sum, tw) => sum + tw.hoursWorked, 0).toFixed(1)}
                    </td>
                    <td className="pt-2 pr-4 text-right">
                      {data.timeWorkedByJanitor.reduce((sum, tw) => sum + tw.shifts, 0)}
                    </td>
                    <td className="pt-2 text-right">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === ACTIVITY HISTORY === */}
      {data.history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Activity History</CardTitle>
          </CardHeader>
          <CardContent>
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
                    <th className="pb-2 font-medium text-right">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((a) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{a.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {a.buildingName}
                        <span className="text-xs"> · {a.floorName}</span>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {new Date(a.scheduledDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline" className="capitalize">{a.status}</Badge>
                      </td>
                      <td className="py-2 pr-4 text-center">{a.completedRooms}/{a.totalRooms}</td>
                      <td className="py-2 pr-4 text-center text-success">{a.passedRooms}</td>
                      <td className="py-2 pr-4 text-center text-destructive">{a.failedRooms}</td>
                      <td className="py-2 text-right font-medium">
                        {a.passRate !== null ? (
                          <span className={a.passRate >= 80 ? "text-success" : a.passRate >= 50 ? "text-warning" : "text-destructive"}>
                            {a.passRate}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom download */}
      <div className="flex justify-center pb-8">
        <Button size="lg" onClick={handleDownload} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download PDF Report
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
