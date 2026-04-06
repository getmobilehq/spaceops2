"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  inviteUserSchema,
  updateUserSchema,
  toggleUserActiveSchema,
  type InviteUserInput,
  type UpdateUserInput,
  type ToggleUserActiveInput,
} from "@/lib/validations/user"
import { headers } from "next/headers"

type ActionResult = { success: true } | { success: false; error: string }

async function getAdminContext() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const role = user.app_metadata?.role as string | undefined
  const orgId = user.app_metadata?.org_id as string | undefined

  if (role !== "admin" || !orgId) return null

  return { user, orgId, supabase }
}

export async function inviteUser(
  input: InviteUserInput
): Promise<ActionResult> {
  const parsed = inviteUserSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) {
    return { success: false, error: "Unauthorized" }
  }

  // Enforce seat limit
  const { data: orgData } = await ctx.supabase
    .from("organisations")
    .select("plan")
    .eq("id", ctx.orgId)
    .single()

  const { getPlanLimits } = await import("@/lib/plans")
  const limits = getPlanLimits((orgData?.plan as "free" | "pro" | "enterprise") || "free")
  if (limits.seats > 0) {
    const { count } = await ctx.supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)

    if ((count || 0) >= limits.seats) {
      return {
        success: false,
        error: `Your plan allows up to ${limits.seats} users. Upgrade to add more.`,
      }
    }
  }

  const admin = createAdminClient()
  const origin = headers().get("origin") || process.env.NEXT_PUBLIC_APP_URL

  // 1. Create auth user with a temporary password
  const tempPassword = crypto.randomUUID().slice(0, 12)
  const orgSlug = (
    await admin
      .from("organisations")
      .select("slug")
      .eq("id", ctx.orgId)
      .single()
  ).data?.slug

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: tempPassword,
      email_confirm: true,
      app_metadata: {
        org_id: ctx.orgId,
        org_slug: orgSlug,
        role: parsed.data.role,
        must_change_password: true,
      },
      user_metadata: {
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
      },
    })

  if (authError) {
    if (authError.message.includes("already been registered")) {
      return { success: false, error: "A user with this email already exists" }
    }
    return { success: false, error: authError.message }
  }

  // 2. Insert into public.users
  const { error: insertError } = await admin.from("users").insert({
    id: authData.user.id,
    org_id: ctx.orgId,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    role: parsed.data.role,
  })

  if (insertError) {
    // Rollback: delete the auth user we just created
    await admin.auth.admin.deleteUser(authData.user.id)
    return { success: false, error: "Failed to create user record" }
  }

  // 3. Send invite email with temporary password via Resend
  try {
    const { inviteEmail } = await import("@/lib/email/templates")
    const { sendEmail } = await import("@/lib/email/send")
    const { data: orgRecord } = await admin
      .from("organisations")
      .select("name")
      .eq("id", ctx.orgId)
      .single()
    const tmpl = inviteEmail({
      firstName: parsed.data.firstName,
      inviterOrgName: orgRecord?.name || "your organisation",
      role: parsed.data.role,
      loginUrl: `${origin}/auth/login`,
      email: parsed.data.email,
      tempPassword,
    })
    await sendEmail({ to: parsed.data.email, ...tmpl })
  } catch (err) {
    // User is created but email failed — admin can resend later
    console.error("Invite email failed:", err)
  }

  return { success: true }
}

export async function updateUser(
  input: UpdateUserInput
): Promise<ActionResult> {
  const parsed = updateUserSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) {
    return { success: false, error: "Unauthorized" }
  }

  // Verify target user belongs to the same org
  const { data: targetUser, error: fetchError } = await ctx.supabase
    .from("users")
    .select("org_id")
    .eq("id", parsed.data.userId)
    .single()

  if (fetchError || !targetUser) {
    return { success: false, error: "User not found" }
  }

  if (targetUser.org_id !== ctx.orgId) {
    return { success: false, error: "Unauthorized" }
  }

  // Update public.users (trigger will sync role to JWT metadata)
  const { error: updateError } = await ctx.supabase
    .from("users")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      role: parsed.data.role,
    })
    .eq("id", parsed.data.userId)

  if (updateError) {
    return { success: false, error: "Failed to update user" }
  }

  // Also update auth user metadata so it's consistent
  const admin = createAdminClient()
  await admin.auth.admin.updateUserById(parsed.data.userId, {
    user_metadata: {
      role: parsed.data.role,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
    },
  })

  return { success: true }
}

export async function toggleUserActive(
  input: ToggleUserActiveInput
): Promise<ActionResult> {
  const parsed = toggleUserActiveSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) {
    return { success: false, error: "Unauthorized" }
  }

  // Prevent self-deactivation
  if (parsed.data.userId === ctx.user.id) {
    return { success: false, error: "You cannot deactivate your own account" }
  }

  // Fetch current state
  const { data: targetUser, error: fetchError } = await ctx.supabase
    .from("users")
    .select("is_active, org_id")
    .eq("id", parsed.data.userId)
    .single()

  if (fetchError || !targetUser) {
    return { success: false, error: "User not found" }
  }

  if (targetUser.org_id !== ctx.orgId) {
    return { success: false, error: "Unauthorized" }
  }

  const newActiveState = !targetUser.is_active

  // Toggle in public.users
  const { error: updateError } = await ctx.supabase
    .from("users")
    .update({ is_active: newActiveState })
    .eq("id", parsed.data.userId)

  if (updateError) {
    return { success: false, error: "Failed to update user status" }
  }

  // Ban/unban auth user
  const admin = createAdminClient()
  await admin.auth.admin.updateUserById(parsed.data.userId, {
    ban_duration: newActiveState ? "none" : "876600h", // ~100 years
  })

  return { success: true }
}
