import { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export async function getSupervisorActivities(
  supabase: SupabaseClient<Database>,
  options?: { date?: string }
) {
  let query = supabase
    .from("cleaning_activities")
    .select(
      "*, floors(floor_name, building_id, buildings(name)), room_tasks(id)"
    )
    .order("scheduled_date", { ascending: false })

  if (options?.date) {
    query = query.eq("scheduled_date", options.date)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getActivityById(
  supabase: SupabaseClient<Database>,
  activityId: string
) {
  const { data, error } = await supabase
    .from("cleaning_activities")
    .select(
      "*, floors(floor_name, buildings(name)), room_tasks(*, rooms(name, room_types(name)), users!room_tasks_assigned_to_fkey(id, first_name, last_name))"
    )
    .eq("id", activityId)
    .single()

  if (error) throw error
  return data
}

export async function getJanitorTodayTasks(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("room_tasks")
    .select(
      "*, rooms(name, room_types(name)), cleaning_activities!inner(name, scheduled_date, window_start, window_end, status, floors(floor_name, buildings(name)))"
    )
    .eq("assigned_to", userId)
    .eq("cleaning_activities.scheduled_date", today)
    .eq("cleaning_activities.status", "active")

  if (error) throw error
  return data
}

export async function getFloorActiveRooms(
  supabase: SupabaseClient<Database>,
  floorId: string
) {
  const { data, error } = await supabase
    .from("rooms")
    .select("id, name, room_types(name)")
    .eq("floor_id", floorId)
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error) throw error
  return data
}

export async function getOrgJanitors(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name")
    .eq("role", "janitor")
    .eq("is_active", true)
    .order("first_name", { ascending: true })

  if (error) throw error
  return data
}

export async function getSupervisorBuildings(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const { data, error } = await supabase
    .from("building_supervisors")
    .select("buildings(id, name, address)")
    .eq("user_id", userId)

  if (error) throw error
  return data.map((row) => row.buildings).filter(Boolean)
}
