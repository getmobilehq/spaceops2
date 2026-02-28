"use server"

import { createClient } from "@/lib/supabase/server"

type ActionResult = { success: true } | { success: false; error: string }

export async function markNotificationRead(
  notificationId: string
): Promise<ActionResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "Unauthorized" }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (error) return { success: false, error: "Failed to mark as read" }
  return { success: true }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "Unauthorized" }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) return { success: false, error: "Failed to mark all as read" }
  return { success: true }
}

/**
 * Helper to create a notification. Called from other server actions.
 * Uses the service-level supabase client (the caller's authenticated client).
 */
export async function createNotification(
  supabase: ReturnType<typeof createClient>,
  params: {
    orgId: string
    userId: string
    type: string
    title: string
    body?: string
    link?: string
  }
) {
  await supabase.from("notifications").insert({
    org_id: params.orgId,
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    link: params.link ?? null,
  })
}
