import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"
import { createAdminClient } from "@/lib/supabase/admin"

export async function getOrgUsageEvents(
  supabase: SupabaseClient<Database>,
  orgId: string,
  periodStart?: string
) {
  const start =
    periodStart ||
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const { data } = await supabase
    .from("usage_events")
    .select("event_type")
    .eq("org_id", orgId)
    .gte("created_at", start)

  const events = data || []
  return {
    aiVectorisations: events.filter(
      (e) => e.event_type === "ai_vectorisation"
    ).length,
    aiReports: events.filter((e) => e.event_type === "ai_report").length,
    apiCalls: events.filter((e) => e.event_type === "api_call").length,
  }
}

export async function getPlatformUsageStats() {
  const admin = createAdminClient()
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString()

  const { data } = await admin
    .from("usage_events")
    .select("org_id, event_type")
    .gte("created_at", monthStart)

  const events = data || []

  return {
    totalAiCalls: events.filter((e) => e.event_type !== "api_call").length,
    totalApiCalls: events.filter((e) => e.event_type === "api_call").length,
    totalEvents: events.length,
  }
}

export async function getPlatformUsageByOrg() {
  const admin = createAdminClient()
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString()

  const [eventsResult, orgsResult] = await Promise.all([
    admin
      .from("usage_events")
      .select("org_id, event_type")
      .gte("created_at", monthStart),
    admin.from("organisations").select("id, name, slug, plan"),
  ])

  const events = eventsResult.data || []
  const orgs = orgsResult.data || []

  const orgMap = new Map(orgs.map((o) => [o.id, o]))

  const byOrg: Record<
    string,
    { name: string; slug: string; plan: string; aiCalls: number; apiCalls: number }
  > = {}

  for (const event of events) {
    if (!byOrg[event.org_id]) {
      const org = orgMap.get(event.org_id)
      byOrg[event.org_id] = {
        name: org?.name || "Unknown",
        slug: org?.slug || "",
        plan: org?.plan || "free",
        aiCalls: 0,
        apiCalls: 0,
      }
    }
    if (event.event_type === "api_call") {
      byOrg[event.org_id].apiCalls++
    } else {
      byOrg[event.org_id].aiCalls++
    }
  }

  return Object.entries(byOrg)
    .map(([orgId, data]) => ({ orgId, ...data }))
    .sort((a, b) => b.aiCalls + b.apiCalls - (a.aiCalls + a.apiCalls))
}
