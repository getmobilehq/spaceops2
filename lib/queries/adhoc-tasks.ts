import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

type Client = SupabaseClient<Database>

export async function getJanitorTodayAdhocTasks(
  supabase: Client,
  userId: string
) {
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("adhoc_tasks")
    .select("*")
    .eq("assigned_to", userId)
    .eq("due_date", today)
    .eq("status", "pending")
    .order("due_time", { ascending: true, nullsFirst: false })

  if (error) return []
  return data
}

export async function getJanitorAdhocTask(
  supabase: Client,
  taskId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from("adhoc_tasks")
    .select("*")
    .eq("id", taskId)
    .eq("assigned_to", userId)
    .single()

  if (error) return null
  return data
}

export async function getJanitorCompletedAdhocTasks(
  supabase: Client,
  userId: string
) {
  const { data, error } = await supabase
    .from("adhoc_tasks")
    .select("*")
    .eq("assigned_to", userId)
    .eq("status", "done")
    .order("completed_at", { ascending: false })

  if (error) return []
  return data
}

export async function getSupervisorAdhocTasks(supabase: Client) {
  const { data, error } = await supabase
    .from("adhoc_tasks")
    .select(
      "*, assigned:users!adhoc_tasks_assigned_to_fkey(id, first_name, last_name)"
    )
    .order("created_at", { ascending: false })

  if (error) return []
  return data
}

export async function getOrgJanitors(supabase: Client) {
  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name")
    .eq("role", "janitor")
    .eq("is_active", true)
    .order("first_name")

  if (error) return []
  return data
}
