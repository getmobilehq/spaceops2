import { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

/**
 * Get buildings with floor/room counts for the client overview.
 */
export async function getClientBuildings(
  supabase: SupabaseClient<Database>
) {
  const { data, error } = await supabase
    .from("buildings")
    .select("id, name, address, status, floors(id, floor_name, rooms(id))")
    .eq("status", "active")
    .order("name", { ascending: true })

  if (error) throw error

  return data.map((b) => ({
    id: b.id,
    name: b.name,
    address: b.address,
    status: b.status,
    floorCount: b.floors?.length ?? 0,
    roomCount: b.floors?.reduce(
      (sum, f) => sum + ((f.rooms as { id: string }[] | null)?.length ?? 0),
      0
    ) ?? 0,
  }))
}

/**
 * Get recent cleaning activity summaries for client buildings.
 */
export async function getClientRecentActivities(
  supabase: SupabaseClient<Database>,
  limit = 10
) {
  const { data, error } = await supabase
    .from("cleaning_activities")
    .select(
      "id, name, status, scheduled_date, window_start, window_end, floors(floor_name, buildings(name)), room_tasks(id, status)"
    )
    .in("status", ["active", "closed"])
    .order("scheduled_date", { ascending: false })
    .limit(limit)

  if (error) throw error

  return data.map((a) => {
    const tasks = (a.room_tasks as { id: string; status: string }[]) || []
    const total = tasks.length
    const passed = tasks.filter((t) => t.status === "inspected_pass").length
    const failed = tasks.filter((t) => t.status === "inspected_fail").length
    const done = tasks.filter((t) => t.status === "done").length
    const inspected = passed + failed
    const passRate = inspected > 0 ? Math.round((passed / inspected) * 100) : null

    return {
      id: a.id,
      name: a.name,
      status: a.status,
      scheduledDate: a.scheduled_date,
      windowStart: a.window_start,
      windowEnd: a.window_end,
      buildingName:
        (a.floors as { floor_name: string; buildings: { name: string } | null } | null)
          ?.buildings?.name || "Unknown",
      floorName:
        (a.floors as { floor_name: string } | null)?.floor_name || "Unknown",
      totalRooms: total,
      completedRooms: done + inspected,
      passedRooms: passed,
      failedRooms: failed,
      passRate,
    }
  })
}

/**
 * Get aggregate dashboard stats for a client org.
 */
export async function getClientDashboardStats(
  supabase: SupabaseClient<Database>
) {
  // Total activities
  const { count: totalActivities } = await supabase
    .from("cleaning_activities")
    .select("id", { count: "exact", head: true })
    .in("status", ["active", "closed"])

  // Room task stats
  const { data: taskStats } = await supabase
    .from("room_tasks")
    .select("status")

  const tasks = taskStats || []
  const totalTasks = tasks.length
  const passedTasks = tasks.filter((t) => t.status === "inspected_pass").length
  const failedTasks = tasks.filter((t) => t.status === "inspected_fail").length
  const inspectedTasks = passedTasks + failedTasks
  const overallPassRate =
    inspectedTasks > 0 ? Math.round((passedTasks / inspectedTasks) * 100) : null

  // Open deficiencies
  const { count: openDeficiencies } = await supabase
    .from("deficiencies")
    .select("id", { count: "exact", head: true })
    .in("status", ["open", "in_progress"])

  return {
    totalActivities: totalActivities ?? 0,
    totalTasks,
    passedTasks,
    failedTasks,
    overallPassRate,
    openDeficiencies: openDeficiencies ?? 0,
  }
}
