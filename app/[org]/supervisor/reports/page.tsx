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
  getPassRatesByClient,
  getPassRatesByFloor,
  getIssueReport,
  type ReportFilters,
} from "@/lib/queries/reports"
import { getSupervisorBuildings } from "@/lib/queries/activities"
import { ReportsDashboard, type ReportView } from "@/components/reports/reports-dashboard"

export const metadata = {
  title: "Reports - SpaceOps",
}

export default async function SupervisorReportsPage({
  params,
  searchParams,
}: {
  params: { org: string }
  searchParams: {
    dateFrom?: string
    dateTo?: string
    buildingId?: string
    clientId?: string
    floorId?: string
    view?: string
  }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const role = user.app_metadata?.role as string | undefined
  if (role !== "supervisor" && role !== "admin") return notFound()

  const view = (searchParams.view || "overview") as ReportView

  // Get supervisor's assigned buildings
  const assignedBuildings = await getSupervisorBuildings(supabase, user.id)
  const buildingOptions = (assignedBuildings as { id: string; name: string; address: string }[]).map(
    (b) => ({ id: b.id, name: b.name })
  )

  const filters: ReportFilters = {
    dateFrom: searchParams.dateFrom || undefined,
    dateTo: searchParams.dateTo || undefined,
    buildingId: searchParams.buildingId || undefined,
    clientId: searchParams.clientId || undefined,
    floorId: searchParams.floorId || undefined,
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

  // View-specific data
  const [byClient, byFloor, issues] = await Promise.all([
    view === "by-client" ? getPassRatesByClient(supabase, filters) : Promise.resolve([]),
    view === "by-floor" ? getPassRatesByFloor(supabase, filters) : Promise.resolve([]),
    view === "issues" ? getIssueReport(supabase, filters) : Promise.resolve([]),
  ])

  // Get floors for the supervisor's buildings
  const buildingIds = buildingOptions.map((b) => b.id)
  const { data: floorRows } = buildingIds.length > 0
    ? await supabase
        .from("floors")
        .select("id, floor_name, buildings!inner(name)")
        .in("building_id", buildingIds)
        .order("floor_name")
    : { data: [] }

  const floorOptions = (floorRows || []).map((f) => ({
    id: f.id,
    name: f.floor_name,
    buildingName: (f.buildings as { name?: string } | null)?.name || "Unknown",
  }))

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
      view={view}
      byClient={byClient}
      byFloor={byFloor}
      issues={issues}
      floors={floorOptions}
    />
  )
}
