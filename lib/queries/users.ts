import { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export async function getOrgUsers(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: true })

  if (error) throw error
  return data
}

export async function getUserById(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single()

  if (error) throw error
  return data
}
