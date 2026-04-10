import { createAdminClient } from "@/lib/supabase/admin"

export async function getAllOrgs() {
  const admin = createAdminClient()
  const { data } = await admin
    .from("organisations")
    .select("id, name, slug, plan, stripe_customer_id, created_at")
    .order("created_at", { ascending: false })

  return data || []
}

export async function getOrgWithCounts(orgId: string) {
  const admin = createAdminClient()

  const [orgResult, usersResult, buildingsResult, subscriptionResult] =
    await Promise.all([
      admin
        .from("organisations")
        .select("*")
        .eq("id", orgId)
        .single(),
      admin
        .from("users")
        .select("id, first_name, last_name, role, is_active, created_at")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false }),
      admin
        .from("buildings")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId),
      admin
        .from("subscriptions")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
    ])

  return {
    org: orgResult.data,
    users: usersResult.data || [],
    buildingCount: buildingsResult.count || 0,
    subscription: subscriptionResult.data,
  }
}

export async function getOrgAuditLog(orgId: string, limit = 20) {
  const admin = createAdminClient()
  const { data } = await admin
    .from("platform_audit_log")
    .select(
      "id, action_type, from_value, to_value, note, created_at, performed_by, users:performed_by(first_name, last_name)"
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit)

  return data || []
}

export async function getAllSubscriptions() {
  const admin = createAdminClient()
  const { data } = await admin
    .from("subscriptions")
    .select("*, organisations(name, slug)")
    .order("created_at", { ascending: false })

  return data || []
}

export async function getPlatformStats() {
  const admin = createAdminClient()

  const [orgs, users, subscriptions] = await Promise.all([
    admin.from("organisations").select("id, plan"),
    admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    admin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
  ])

  const orgData = orgs.data || []
  const planDistribution = {
    free: orgData.filter((o) => o.plan === "free").length,
    pro: orgData.filter((o) => o.plan === "pro").length,
    enterprise: orgData.filter((o) => o.plan === "enterprise").length,
  }

  return {
    totalOrgs: orgData.length,
    totalUsers: users.count || 0,
    activeSubscriptions: subscriptions.count || 0,
    planDistribution,
  }
}
