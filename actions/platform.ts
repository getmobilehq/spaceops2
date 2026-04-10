"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"

type ActionResult = { success: true } | { success: false; error: string }

const planEnum = z.enum(["free", "pro", "enterprise"])

const updateOrgPlanSchema = z.object({
  orgId: z.string().uuid(),
  plan: planEnum,
  note: z.string().max(500).optional(),
})

const suspendOrgSchema = z.object({
  orgId: z.string().uuid(),
  reason: z.string().min(1).max(500),
})

const unsuspendOrgSchema = z.object({
  orgId: z.string().uuid(),
})

const deleteOrgSchema = z.object({
  orgId: z.string().uuid(),
})

async function getSuperAdminContext() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null
  if (user.app_metadata?.is_super_admin !== true) return null

  return { user, supabase }
}

async function logAction(
  orgId: string | null,
  performedBy: string,
  actionType: "plan_change" | "suspend" | "unsuspend" | "delete",
  fromValue: string | null,
  toValue: string | null,
  note?: string
) {
  const admin = createAdminClient()
  await admin.from("platform_audit_log").insert({
    org_id: orgId,
    performed_by: performedBy,
    action_type: actionType,
    from_value: fromValue,
    to_value: toValue,
    note: note ?? null,
  })
}

export async function updateOrgPlan(
  input: z.infer<typeof updateOrgPlanSchema>
): Promise<ActionResult> {
  const parsed = updateOrgPlanSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSuperAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const admin = createAdminClient()

  // Get current plan for audit log
  const { data: existing } = await admin
    .from("organisations")
    .select("plan")
    .eq("id", parsed.data.orgId)
    .single()

  if (!existing) return { success: false, error: "Organisation not found" }
  if (existing.plan === parsed.data.plan) {
    return { success: false, error: "Organisation is already on this plan" }
  }

  const { error } = await admin
    .from("organisations")
    .update({ plan: parsed.data.plan })
    .eq("id", parsed.data.orgId)

  if (error) return { success: false, error: "Failed to update plan" }

  await logAction(
    parsed.data.orgId,
    ctx.user.id,
    "plan_change",
    existing.plan,
    parsed.data.plan,
    parsed.data.note
  )

  return { success: true }
}

export async function suspendOrg(
  input: z.infer<typeof suspendOrgSchema>
): Promise<ActionResult> {
  const parsed = suspendOrgSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSuperAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from("organisations")
    .select("suspended_at")
    .eq("id", parsed.data.orgId)
    .single()

  if (!existing) return { success: false, error: "Organisation not found" }
  if (existing.suspended_at) {
    return { success: false, error: "Organisation is already suspended" }
  }

  const { error } = await admin
    .from("organisations")
    .update({
      suspended_at: new Date().toISOString(),
      suspended_reason: parsed.data.reason,
    })
    .eq("id", parsed.data.orgId)

  if (error) return { success: false, error: "Failed to suspend organisation" }

  await logAction(
    parsed.data.orgId,
    ctx.user.id,
    "suspend",
    null,
    null,
    parsed.data.reason
  )

  return { success: true }
}

export async function unsuspendOrg(
  input: z.infer<typeof unsuspendOrgSchema>
): Promise<ActionResult> {
  const parsed = unsuspendOrgSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSuperAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const admin = createAdminClient()

  const { error } = await admin
    .from("organisations")
    .update({
      suspended_at: null,
      suspended_reason: null,
    })
    .eq("id", parsed.data.orgId)

  if (error) return { success: false, error: "Failed to unsuspend organisation" }

  await logAction(parsed.data.orgId, ctx.user.id, "unsuspend", null, null)

  return { success: true }
}

export async function deleteOrg(
  input: z.infer<typeof deleteOrgSchema>
): Promise<ActionResult> {
  const parsed = deleteOrgSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSuperAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const admin = createAdminClient()
  const orgId = parsed.data.orgId

  // Get org name for audit log before deletion
  const { data: existing } = await admin
    .from("organisations")
    .select("name")
    .eq("id", orgId)
    .single()

  if (!existing) return { success: false, error: "Organisation not found" }

  // Get all users in the org so we can delete their auth records
  const { data: orgUsers } = await admin
    .from("users")
    .select("id")
    .eq("org_id", orgId)

  const userIds = orgUsers?.map((u) => u.id) || []

  // Delete auth users (auth.admin.deleteUser handles each one)
  for (const userId of userIds) {
    await admin.auth.admin.deleteUser(userId).catch(() => {
      // Ignore individual auth delete failures — the cascade will still
      // remove the public.users record
    })
  }

  // Log the action BEFORE deletion (FK will set org_id to null after)
  await logAction(orgId, ctx.user.id, "delete", existing.name, null)

  // Delete the org — relies on ON DELETE CASCADE for related tables
  const { error } = await admin
    .from("organisations")
    .delete()
    .eq("id", orgId)

  if (error) {
    return { success: false, error: `Failed to delete organisation: ${error.message}` }
  }

  return { success: true }
}
