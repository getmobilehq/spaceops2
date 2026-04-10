import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import {
  getReportSummary,
  getPassRatesByBuilding,
  getPassRatesByJanitor,
  getTimeWorkedByJanitor,
  getPassRatesByClient,
  getPassRatesByFloor,
  getActivityHistory,
  getDeficiencyBreakdown,
  getIssueReport,
  getPreviousPeriodFilters,
  type ReportFilters,
} from "@/lib/queries/reports"
import { getOrgBuildings } from "@/lib/queries/buildings"
import { getOrgClients } from "@/lib/queries/clients"
import { generateExecutiveSummary } from "@/actions/reports"
import { ReportPreview } from "@/components/reports/report-preview"
import type { ReportData, FloorPlanData } from "@/components/reports/report-types"

export const metadata = {
  title: "Generate Report - SpaceOps",
}

export default async function GenerateReportPage({
  searchParams,
}: {
  params: { org: string }
  searchParams: {
    dateFrom?: string
    dateTo?: string
    buildingId?: string
    clientId?: string
    floorId?: string
  }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const role = user.app_metadata?.role as string | undefined
  if (role !== "admin") return notFound()

  const orgId = user.app_metadata?.org_id as string
  const { data: org } = await supabase
    .from("organisations")
    .select("name, logo_url")
    .eq("id", orgId)
    .single()

  const orgName = org?.name || "SpaceOps"
  const orgLogoUrl = org?.logo_url || null

  const filters: ReportFilters = {
    dateFrom: searchParams.dateFrom || undefined,
    dateTo: searchParams.dateTo || undefined,
    buildingId: searchParams.buildingId || undefined,
    clientId: searchParams.clientId || undefined,
    floorId: searchParams.floorId || undefined,
  }

  const prevFilters = getPreviousPeriodFilters(filters)

  // Fetch all report data in parallel
  const [
    summary,
    prevSummary,
    byBuilding,
    byJanitor,
    timeWorkedByJanitor,
    byClient,
    byFloor,
    history,
    deficiencies,
    issues,
    buildings,
    allClients,
  ] = await Promise.all([
    getReportSummary(supabase, filters),
    getReportSummary(supabase, prevFilters),
    getPassRatesByBuilding(supabase, filters),
    getPassRatesByJanitor(supabase, filters),
    getTimeWorkedByJanitor(supabase, filters),
    getPassRatesByClient(supabase, filters),
    getPassRatesByFloor(supabase, filters),
    getActivityHistory(supabase, 50, filters),
    getDeficiencyBreakdown(supabase),
    getIssueReport(supabase, filters),
    getOrgBuildings(supabase),
    getOrgClients(supabase),
  ])

  // Fetch floor plans
  const { data: floorRows } = await supabase
    .from("floors")
    .select("id, floor_name, building_id, buildings!inner(name), vectorised_plans(original_path), rooms(id)")
    .order("floor_name")

  const floorPlans: FloorPlanData[] = []
  for (const floor of floorRows || []) {
    const plan = floor.vectorised_plans as { original_path: string }[] | null
    const originalPath = plan?.[0]?.original_path
    if (!originalPath) continue

    const { data: urlData } = await supabase.storage
      .from("floor-plans")
      .createSignedUrl(originalPath, 3600)

    if (urlData?.signedUrl) {
      floorPlans.push({
        floorId: floor.id,
        buildingName: (floor.buildings as { name?: string } | null)?.name || "Unknown",
        floorName: floor.floor_name,
        imageUrl: urlData.signedUrl,
        roomCount: (floor.rooms as { id: string }[])?.length || 0,
      })
    }
  }

  // Get floor count
  const { count: floorCount } = await supabase
    .from("floors")
    .select("id", { count: "exact", head: true })

  // Sort buildings by pass rate for AI summary
  const sorted = [...byBuilding].sort((a, b) => b.passRate - a.passRate)
  const topBuildings = sorted.slice(0, 3)
  const bottomBuildings = sorted.slice(-3).reverse()

  // Generate AI executive summary
  let executiveSummary: string
  try {
    executiveSummary = await generateExecutiveSummary({
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
      orgName,
      summary,
      previousSummary: prevSummary,
      buildingCount: buildings.length,
      clientCount: allClients.length,
      floorCount: floorCount || 0,
      topBuildings,
      bottomBuildings,
      issueBreakdown: {
        high: deficiencies.bySeverity.high,
        medium: deficiencies.bySeverity.medium,
        low: deficiencies.bySeverity.low,
        open: deficiencies.byStatus.open,
      },
    })
  } catch {
    executiveSummary =
      "Executive summary generation is currently unavailable. Please review the data sections below for a comprehensive overview of operational performance during the reporting period."
  }

  const reportData: ReportData = {
    orgName,
    orgLogoUrl,
    filters,
    executiveSummary,
    summary,
    previousSummary: prevSummary,
    byBuilding,
    byJanitor,
    timeWorkedByJanitor,
    byClient,
    byFloor,
    issues,
    history,
    deficiencies,
    floorPlans,
    buildingCount: buildings.length,
    clientCount: allClients.length,
    floorCount: floorCount || 0,
  }

  return <ReportPreview data={reportData} />
}
