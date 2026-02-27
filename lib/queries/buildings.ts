import { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export async function getOrgBuildings(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("buildings")
    .select("*, clients(company_name), floors(id)")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getBuildingById(
  supabase: SupabaseClient<Database>,
  buildingId: string
) {
  const { data, error } = await supabase
    .from("buildings")
    .select(
      "*, clients(*), floors(*), building_supervisors(user_id, users(id, first_name, last_name, role))"
    )
    .eq("id", buildingId)
    .single()

  if (error) throw error
  return data
}

export async function getFloorById(
  supabase: SupabaseClient<Database>,
  floorId: string
) {
  const { data, error } = await supabase
    .from("floors")
    .select("*, vectorised_plans(*)")
    .eq("id", floorId)
    .single()

  if (error) throw error
  return data
}

export async function getOrgSupervisors(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name")
    .eq("role", "supervisor")
    .eq("is_active", true)
    .order("first_name", { ascending: true })

  if (error) throw error
  return data
}
