import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import {
  getReportSummary,
  getPassRatesByBuilding,
  getPassRatesByJanitor,
  getActivityTrend,
  getActivityHistory,
  getDeficiencyBreakdown,
  getPreviousPeriodFilters,
  type ReportFilters,
} from "@/lib/queries/reports"
import { getSupervisorBuildings } from "@/lib/queries/activities"
import { ReportsDashboard } from "@/components/reports/reports-dashboard"

export const metadata = {
  title: "Reports - SpaceOps",
}

export default async function SupervisorReportsPage({
  params,
  searchParams,
}: {
  params: { org: string }
  searchParams: { dateFrom?: string; dateTo?: string; buildingId?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const role = user.app_metadata?.role as string | undefined
  if (role !== "supervisor" && role !== "admin") return notFound()

  // Get supervisor's assigned buildings
  const assignedBuildings = await getSupervisorBuildings(supabase, user.id)
  const buildingOptions = (assignedBuildings as { id: string; name: string; address: string }[]).map(
    (b) => ({ id: b.id, name: b.name })
  )

  // If a specific building filter is set, use it; otherwise no building filter
  // (queries will return data for all accessible buildings via RLS)
  const filters: ReportFilters = {
    dateFrom: searchParams.dateFrom || undefined,
    dateTo: searchParams.dateTo || undefined,
    buildingId: searchParams.buildingId || undefined,
  }

  const prevFilters = getPreviousPeriodFilters(filters)

  const [summary, prevSummary, byBuilding, byJanitor, trend, history, deficiencies] =
    await Promise.all([
      getReportSummary(supabase, filters),
      getReportSummary(supabase, prevFilters),
      getPassRatesByBuilding(supabase, filters),
      getPassRatesByJanitor(supabase, filters),
      getActivityTrend(supabase, 30, filters),
      getActivityHistory(supabase, 50, filters),
      getDeficiencyBreakdown(supabase),
    ])

  return (
    <ReportsDashboard
      summary={summary}
      previousSummary={prevSummary}
      byBuilding={byBuilding}
      byJanitor={byJanitor}
      trend={trend}
      history={history}
      deficiencies={deficiencies}
      orgSlug={params.org}
      buildings={buildingOptions}
      filters={filters}
    />
  )
}
