import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export async function getOrgSubscription(
  supabase: SupabaseClient<Database>,
  orgId: string
) {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  return data
}

export async function getOrgUsage(
  supabase: SupabaseClient<Database>,
  orgId: string
) {
  const [buildings, users] = await Promise.all([
    supabase
      .from("buildings")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .neq("status", "inactive"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("is_active", true),
  ])

  return {
    buildingCount: buildings.count || 0,
    userCount: users.count || 0,
  }
}
