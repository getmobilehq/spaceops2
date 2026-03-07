import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getOrgSubscription, getOrgUsage } from "@/lib/queries/billing"
import { getOrgUsageEvents } from "@/lib/queries/usage"
import { BillingDashboard } from "./billing-dashboard"
import type { Tables } from "@/lib/supabase/types"

export const metadata = { title: "Billing - SpaceOps" }

export default async function BillingPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const orgId = user.app_metadata?.org_id as string | undefined
  if (!orgId) return notFound()

  const { data: org } = await supabase
    .from("organisations")
    .select("*")
    .eq("id", orgId)
    .single()

  if (!org) return notFound()

  const [subscription, usage, usageEvents] = await Promise.all([
    getOrgSubscription(supabase, orgId),
    getOrgUsage(supabase, orgId),
    getOrgUsageEvents(supabase, orgId),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing
        </p>
      </div>
      <BillingDashboard
        plan={(org as Tables<"organisations">).plan}
        subscription={subscription}
        buildingCount={usage.buildingCount}
        userCount={usage.userCount}
        aiVectorisations={usageEvents.aiVectorisations}
        aiReports={usageEvents.aiReports}
        apiCalls={usageEvents.apiCalls}
      />
    </div>
  )
}
