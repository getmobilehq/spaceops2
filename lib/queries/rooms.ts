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

/**
 * Get floor rooms with current cleaning status from the most recent active activity.
 */
export async function getFloorRoomsWithStatus(
  supabase: SupabaseClient<Database>,
  floorId: string
) {
  // Get rooms with positions and types
  const { data: rooms, error } = await supabase
    .from("rooms")
    .select("id, name, pin_x, pin_y, is_active, room_types(name)")
    .eq("floor_id", floorId)
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error) throw error

  // Get room tasks from active activities on this floor
  const { data: tasks } = await supabase
    .from("room_tasks")
    .select("room_id, status, cleaning_activities!inner(status, floor_id)")
    .eq("cleaning_activities.floor_id", floorId)
    .eq("cleaning_activities.status", "active")

  // Build a map of room_id → latest task status
  const statusMap = new Map<string, string>()
  for (const t of tasks || []) {
    statusMap.set(t.room_id, t.status)
  }

  return rooms.map((r) => ({
    ...r,
    taskStatus: statusMap.get(r.id) || null,
  }))
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
