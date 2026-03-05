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
import { getOrgBuildings } from "@/lib/queries/buildings"
import { getOrgClients } from "@/lib/queries/clients"
import { ReportsDashboard, type ReportView } from "@/components/reports/reports-dashboard"

export const metadata = {
  title: "Reports - SpaceOps",
}

export default async function ReportsPage({
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
  if (role !== "admin") return notFound()

  const view = (searchParams.view || "overview") as ReportView

  const filters: ReportFilters = {
    dateFrom: searchParams.dateFrom || undefined,
    dateTo: searchParams.dateTo || undefined,
    buildingId: searchParams.buildingId || undefined,
    clientId: searchParams.clientId || undefined,
    floorId: searchParams.floorId || undefined,
  }

  const prevFilters = getPreviousPeriodFilters(filters)

  const [summary, prevSummary, byBuilding, byJanitor, trend, history, deficiencies, buildings, allClients] =
    await Promise.all([
      getReportSummary(supabase, filters),
      getReportSummary(supabase, prevFilters),
      getPassRatesByBuilding(supabase, filters),
      getPassRatesByJanitor(supabase, filters),
      getActivityTrend(supabase, 30, filters),
      getActivityHistory(supabase, 50, filters),
      getDeficiencyBreakdown(supabase),
      getOrgBuildings(supabase),
      getOrgClients(supabase),
    ])

  // View-specific data
  const [byClient, byFloor, issues] = await Promise.all([
    view === "by-client" ? getPassRatesByClient(supabase, filters) : Promise.resolve([]),
    view === "by-floor" ? getPassRatesByFloor(supabase, filters) : Promise.resolve([]),
    view === "issues" ? getIssueReport(supabase, filters) : Promise.resolve([]),
  ])

  const buildingOptions = buildings.map((b) => ({ id: b.id, name: b.name }))
  const clientOptions = allClients.map((c) => ({ id: c.id, name: c.company_name }))

  // Get floors for filter dropdown
  const { data: floorRows } = await supabase
    .from("floors")
    .select("id, floor_name, buildings!inner(name)")
    .order("floor_name")

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
      clients={clientOptions}
      floors={floorOptions}
    />
  )
}
