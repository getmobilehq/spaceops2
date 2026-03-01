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

/**
 * Get janitor's completed tasks (history).
 */
export async function getJanitorTaskHistory(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit = 50
) {
  const { data, error } = await supabase
    .from("room_tasks")
    .select(
      "id, status, started_at, completed_at, rooms(name, room_types(name)), cleaning_activities!inner(name, scheduled_date, floors(floor_name, buildings(name)))"
    )
    .eq("assigned_to", userId)
    .in("status", ["done", "inspected_pass", "inspected_fail"])
    .order("completed_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

/**
 * Performance trend data for a janitor — weekly pass/fail counts.
 */
export async function getJanitorPerformanceTrend(
  supabase: SupabaseClient<Database>,
  userId: string,
  weeks = 8
) {
  const since = new Date()
  since.setDate(since.getDate() - weeks * 7)
  const sinceStr = since.toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("room_tasks")
    .select(
      "status, cleaning_activities!inner(scheduled_date)"
    )
    .eq("assigned_to", userId)
    .in("status", ["inspected_pass", "inspected_fail", "done"])
    .gte("cleaning_activities.scheduled_date", sinceStr)

  if (error) throw error

  // Group by ISO week
  const weekMap = new Map<
    string,
    { week: string; passed: number; failed: number; done: number }
  >()

  for (const task of data || []) {
    const dateStr = (task.cleaning_activities as any)?.scheduled_date
    if (!dateStr) continue
    const d = new Date(dateStr)
    // Get Monday of the week
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((day + 6) % 7))
    const weekKey = monday.toISOString().split("T")[0]

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { week: weekKey, passed: 0, failed: 0, done: 0 })
    }
    const entry = weekMap.get(weekKey)!
    if (task.status === "inspected_pass") entry.passed++
    else if (task.status === "inspected_fail") entry.failed++
    else if (task.status === "done") entry.done++
  }

  return Array.from(weekMap.values()).sort((a, b) =>
    a.week.localeCompare(b.week)
  )
}

/**
 * Aggregate performance stats for a janitor.
 */
export async function getJanitorPerformanceStats(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const { data, error } = await supabase
    .from("room_tasks")
    .select("status, completed_at")
    .eq("assigned_to", userId)
    .in("status", ["done", "inspected_pass", "inspected_fail"])

  if (error) throw error

  const tasks = data || []
  const total = tasks.length
  const passed = tasks.filter((t) => t.status === "inspected_pass").length
  const failed = tasks.filter((t) => t.status === "inspected_fail").length
  const inspected = passed + failed
  const passRate =
    inspected > 0 ? Math.round((passed / inspected) * 100) : null

  // Calculate current streak (consecutive passes)
  const inspectedTasks = tasks
    .filter(
      (t) =>
        t.status === "inspected_pass" || t.status === "inspected_fail"
    )
    .sort(
      (a, b) =>
        new Date(b.completed_at || 0).getTime() -
        new Date(a.completed_at || 0).getTime()
    )

  let streak = 0
  for (const t of inspectedTasks) {
    if (t.status === "inspected_pass") streak++
    else break
  }

  return {
    totalCompleted: total,
    passed,
    failed,
    awaitingInspection: total - inspected,
    passRate,
    currentStreak: streak,
  }
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
