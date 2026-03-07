import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export async function getOrgApiKeys(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, last_used_at, created_at, revoked_at")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}
