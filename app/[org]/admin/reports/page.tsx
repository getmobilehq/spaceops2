import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import {
  getReportSummary,
  getPassRatesByBuilding,
  getPassRatesByJanitor,
  getActivityTrend,
  getActivityHistory,
  getDeficiencyBreakdown,
  type ReportFilters,
} from "@/lib/queries/reports"
import { getOrgBuildings } from "@/lib/queries/buildings"
import { ReportsDashboard } from "./reports-dashboard"

export const metadata = {
  title: "Reports - SpaceOps",
}

export default async function ReportsPage({
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
  if (role !== "admin") return notFound()

  const filters: ReportFilters = {
    dateFrom: searchParams.dateFrom || undefined,
    dateTo: searchParams.dateTo || undefined,
    buildingId: searchParams.buildingId || undefined,
  }

  const [summary, byBuilding, byJanitor, trend, history, deficiencies, buildings] =
    await Promise.all([
      getReportSummary(supabase, filters),
      getPassRatesByBuilding(supabase, filters),
      getPassRatesByJanitor(supabase, filters),
      getActivityTrend(supabase, 30, filters),
      getActivityHistory(supabase, 50, filters),
      getDeficiencyBreakdown(supabase),
      getOrgBuildings(supabase),
    ])

  const buildingOptions = buildings.map((b) => ({ id: b.id, name: b.name }))

  return (
    <ReportsDashboard
      summary={summary}
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
