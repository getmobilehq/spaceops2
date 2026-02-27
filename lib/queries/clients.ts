import { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export async function getOrgClients(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("clients")
    .select("*, buildings(id)")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getClientById(
  supabase: SupabaseClient<Database>,
  clientId: string
) {
  const { data, error } = await supabase
    .from("clients")
    .select("*, buildings(id, name, status, address)")
    .eq("id", clientId)
    .single()

  if (error) throw error
  return data
}
