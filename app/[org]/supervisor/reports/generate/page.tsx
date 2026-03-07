import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import {
  getReportSummary,
  getPassRatesByBuilding,
  getPassRatesByJanitor,
  getPassRatesByClient,
  getPassRatesByFloor,
  getActivityHistory,
  getDeficiencyBreakdown,
  getIssueReport,
  getPreviousPeriodFilters,
  type ReportFilters,
} from "@/lib/queries/reports"
import { getSupervisorBuildings } from "@/lib/queries/activities"
import { generateExecutiveSummary } from "@/actions/reports"
import { ReportPreview } from "@/components/reports/report-preview"
import type { ReportData, FloorPlanData } from "@/components/reports/report-types"

export const metadata = {
  title: "Generate Report - SpaceOps",
}

export default async function SupervisorGenerateReportPage({
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
  if (role !== "supervisor" && role !== "admin") return notFound()

  const orgId = user.app_metadata?.org_id as string
  const { data: org } = await supabase
    .from("organisations")
    .select("name, logo_url")
    .eq("id", orgId)
    .single()

  const orgName = org?.name || "SpaceOps"
  const orgLogoUrl = org?.logo_url || null

  const assignedBuildings = await getSupervisorBuildings(supabase, user.id)
  const buildingIds = (assignedBuildings as { id: string; name: string }[]).map((b) => b.id)

  const filters: ReportFilters = {
    dateFrom: searchParams.dateFrom || undefined,
    dateTo: searchParams.dateTo || undefined,
    buildingId: searchParams.buildingId || undefined,
    clientId: searchParams.clientId || undefined,
    floorId: searchParams.floorId || undefined,
  }

  const prevFilters = getPreviousPeriodFilters(filters)

  const [
    summary,
    prevSummary,
    byBuilding,
    byJanitor,
    byClient,
    byFloor,
    history,
    deficiencies,
    issues,
  ] = await Promise.all([
    getReportSummary(supabase, filters),
    getReportSummary(supabase, prevFilters),
    getPassRatesByBuilding(supabase, filters),
    getPassRatesByJanitor(supabase, filters),
    getPassRatesByClient(supabase, filters),
    getPassRatesByFloor(supabase, filters),
    getActivityHistory(supabase, 50, filters),
    getDeficiencyBreakdown(supabase),
    getIssueReport(supabase, filters),
  ])

  // Fetch floor plans for supervisor's buildings
  const floorPlans: FloorPlanData[] = []
  if (buildingIds.length > 0) {
    const { data: floorRows } = await supabase
      .from("floors")
      .select("id, floor_name, building_id, buildings!inner(name), vectorised_plans(original_path), rooms(id)")
      .in("building_id", buildingIds)
      .order("floor_name")

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
  }

  const { count: floorCount } = buildingIds.length > 0
    ? await supabase
        .from("floors")
        .select("id", { count: "exact", head: true })
        .in("building_id", buildingIds)
    : { count: 0 }

  const sorted = [...byBuilding].sort((a, b) => b.passRate - a.passRate)
  const topBuildings = sorted.slice(0, 3)
  const bottomBuildings = sorted.slice(-3).reverse()

  let executiveSummary: string
  try {
    executiveSummary = await generateExecutiveSummary({
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
      orgName,
      summary,
      previousSummary: prevSummary,
      buildingCount: buildingIds.length,
      clientCount: 0,
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
    byClient,
    byFloor,
    issues,
    history,
    deficiencies,
    floorPlans,
    buildingCount: buildingIds.length,
    clientCount: 0,
    floorCount: floorCount || 0,
  }

  return <ReportPreview data={reportData} />
}
