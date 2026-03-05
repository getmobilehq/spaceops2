import { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export async function getJanitorTodayAttendance(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("attendance_records")
    .select("*, buildings(name)")
    .eq("user_id", userId)
    .eq("date", today)
    .order("clock_in_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getJanitorAttendanceHistory(
  supabase: SupabaseClient<Database>,
  userId: string,
  options?: { limit?: number; dateFrom?: string; dateTo?: string }
) {
  let query = supabase
    .from("attendance_records")
    .select("*, buildings(name)")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("clock_in_at", { ascending: false })

  if (options?.dateFrom) {
    query = query.gte("date", options.dateFrom)
  }
  if (options?.dateTo) {
    query = query.lte("date", options.dateTo)
  }

  query = query.limit(options?.limit ?? 30)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getBuildingAttendanceByDate(
  supabase: SupabaseClient<Database>,
  buildingId: string,
  date: string
) {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*, users(id, first_name, last_name)")
    .eq("building_id", buildingId)
    .eq("date", date)
    .order("clock_in_at", { ascending: true })

  if (error) throw error
  return data
}

export async function getSupervisorBuildingAttendance(
  supabase: SupabaseClient<Database>,
  supervisorUserId: string
) {
  const today = new Date().toISOString().split("T")[0]

  // Get supervisor's buildings
  const { data: assignments, error: assignError } = await supabase
    .from("building_supervisors")
    .select("building_id, buildings(id, name)")
    .eq("user_id", supervisorUserId)

  if (assignError) throw assignError
  if (!assignments || assignments.length === 0) return []

  const buildingIds = assignments.map((a) => a.building_id)

  // Get today's attendance for those buildings
  const { data: records, error: recordsError } = await supabase
    .from("attendance_records")
    .select("*, users(id, first_name, last_name), buildings(name)")
    .in("building_id", buildingIds)
    .eq("date", today)
    .order("clock_in_at", { ascending: true })

  if (recordsError) throw recordsError
  return records
}
