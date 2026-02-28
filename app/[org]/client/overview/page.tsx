import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import {
  getClientBuildings,
  getClientRecentActivities,
  getClientDashboardStats,
} from "@/lib/queries/client-dashboard"
import { ClientDashboard } from "./client-dashboard"

export const metadata = {
  title: "Overview - SpaceOps",
}

export default async function ClientOverviewPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const [buildings, activities, stats] = await Promise.all([
    getClientBuildings(supabase),
    getClientRecentActivities(supabase),
    getClientDashboardStats(supabase),
  ])

  return (
    <ClientDashboard
      buildings={buildings}
      activities={activities}
      stats={stats}
      orgSlug={params.org}
    />
  )
}
