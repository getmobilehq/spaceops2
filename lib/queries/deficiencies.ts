import { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

/**
 * Get all deficiencies for an org, optionally filtered by status.
 */
export async function getOrgDeficiencies(
  supabase: SupabaseClient<Database>,
  status?: string
) {
  let query = supabase
    .from("deficiencies")
    .select(
      "*, room_tasks(id, rooms(name, room_types(name)), cleaning_activities(name, scheduled_date)), reporter:users!deficiencies_reported_by_fkey(first_name, last_name), assignee:users!deficiencies_assigned_to_fkey(first_name, last_name)"
    )
    .order("created_at", { ascending: false })

  if (status && status !== "all") {
    query = query.eq("status", status as "open" | "in_progress" | "resolved")
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * Get deficiencies assigned to a specific user.
 */
export async function getMyDeficiencies(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const { data, error } = await supabase
    .from("deficiencies")
    .select(
      "*, room_tasks(id, rooms(name, room_types(name)), cleaning_activities(name, scheduled_date))"
    )
    .eq("assigned_to", userId)
    .in("status", ["open", "in_progress"])
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get deficiencies for a specific room task.
 */
export async function getTaskDeficiencies(
  supabase: SupabaseClient<Database>,
  roomTaskId: string
) {
  const { data, error } = await supabase
    .from("deficiencies")
    .select(
      "*, reporter:users!deficiencies_reported_by_fkey(first_name, last_name), assignee:users!deficiencies_assigned_to_fkey(first_name, last_name)"
    )
    .eq("room_task_id", roomTaskId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}
