import { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export async function getFloorRooms(
  supabase: SupabaseClient<Database>,
  floorId: string
) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*, room_types(name), room_checklist_overrides(template_id, checklist_templates(name))")
    .eq("floor_id", floorId)
    .order("name", { ascending: true })

  if (error) throw error
  return data
}

export async function getRoomById(
  supabase: SupabaseClient<Database>,
  roomId: string
) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*, room_types(name), floors(id, floor_name, floor_number, building_id)")
    .eq("id", roomId)
    .single()

  if (error) throw error
  return data
}

export async function getOrgRoomTypes(
  supabase: SupabaseClient<Database>
) {
  const { data, error } = await supabase
    .from("room_types")
    .select("id, name, is_default")
    .order("name", { ascending: true })

  if (error) throw error
  return data
}
