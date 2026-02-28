import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import {
  getReportSummary,
  getPassRatesByBuilding,
  getPassRatesByJanitor,
  getActivityTrend,
  getActivityHistory,
  getDeficiencyBreakdown,
} from "@/lib/queries/reports"
import { ReportsDashboard } from "./reports-dashboard"

export const metadata = {
  title: "Reports - SpaceOps",
}

export default async function ReportsPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const role = user.app_metadata?.role as string | undefined
  if (role !== "admin") return notFound()

  const [summary, byBuilding, byJanitor, trend, history, deficiencies] =
    await Promise.all([
      getReportSummary(supabase),
      getPassRatesByBuilding(supabase),
      getPassRatesByJanitor(supabase),
      getActivityTrend(supabase, 30),
      getActivityHistory(supabase, 20),
      getDeficiencyBreakdown(supabase),
    ])

  return (
    <ReportsDashboard
      summary={summary}
      byBuilding={byBuilding}
      byJanitor={byJanitor}
      trend={trend}
      history={history}
      deficiencies={deficiencies}
      orgSlug={params.org}
    />
  )
}
