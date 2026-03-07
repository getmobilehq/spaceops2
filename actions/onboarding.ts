"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

type ActionResult = { success: true } | { success: false; error: string }

export async function completeOnboarding(): Promise<ActionResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "Unauthorized" }

  const role = user.app_metadata?.role as string | undefined
  const orgId = user.app_metadata?.org_id as string | undefined

  if (role !== "admin" || !orgId) {
    return { success: false, error: "Unauthorized" }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from("organisations")
    .update({ onboarding_completed: true })
    .eq("id", orgId)

  if (error) {
    return { success: false, error: "Failed to complete onboarding" }
  }

  return { success: true }
}
