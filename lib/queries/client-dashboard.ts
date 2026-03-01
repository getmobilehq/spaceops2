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
 * Get deficiencies visible to client (open + in_progress).
 */
export async function getClientDeficiencies(
  supabase: SupabaseClient<Database>
) {
  const { data, error } = await supabase
    .from("deficiencies")
    .select(
      "id, description, severity, status, created_at, room_tasks(rooms(name), cleaning_activities(name, scheduled_date, floors(buildings(name))))"
    )
    .in("status", ["open", "in_progress", "resolved"])
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) throw error
  return data
}

/**
 * SLA metrics for client dashboard.
 * Calculated from existing data — no additional DB columns needed.
 */
export async function getClientSLAMetrics(
  supabase: SupabaseClient<Database>
) {
  const SLA_PASS_RATE_TARGET = 90 // % target
  const SLA_RESOLUTION_HOURS = { high: 24, medium: 48, low: 168 } // 7 days for low

  // Get closed activities with task stats for completion rate
  const { data: activities } = await supabase
    .from("cleaning_activities")
    .select("id, status, scheduled_date, room_tasks(id, status)")
    .eq("status", "closed")
    .order("scheduled_date", { ascending: false })
    .limit(50)

  const closedActivities = activities || []
  let activitiesMeetingPassRate = 0
  let activitiesWithInspections = 0
  let totalCompletionRate = 0
  let activitiesWithRooms = 0

  for (const a of closedActivities) {
    const tasks = (a.room_tasks as { id: string; status: string }[]) || []
    const total = tasks.length
    if (total === 0) continue

    const passed = tasks.filter((t) => t.status === "inspected_pass").length
    const failed = tasks.filter((t) => t.status === "inspected_fail").length
    const inspected = passed + failed
    const completed = tasks.filter(
      (t) =>
        t.status === "done" ||
        t.status === "inspected_pass" ||
        t.status === "inspected_fail"
    ).length

    activitiesWithRooms++
    totalCompletionRate += (completed / total) * 100

    if (inspected > 0) {
      activitiesWithInspections++
      const passRate = (passed / inspected) * 100
      if (passRate >= SLA_PASS_RATE_TARGET) activitiesMeetingPassRate++
    }
  }

  const passRateCompliance =
    activitiesWithInspections > 0
      ? Math.round((activitiesMeetingPassRate / activitiesWithInspections) * 100)
      : null
  const avgCompletionRate =
    activitiesWithRooms > 0
      ? Math.round(totalCompletionRate / activitiesWithRooms)
      : null

  // Deficiency resolution metrics
  const { data: deficiencies } = await supabase
    .from("deficiencies")
    .select("severity, status, created_at, resolved_at")
    .order("created_at", { ascending: false })
    .limit(100)

  let onTrack = 0
  let atRisk = 0
  let breached = 0
  let totalResolutionHours = 0
  let resolvedCount = 0

  const now = Date.now()
  for (const d of deficiencies || []) {
    const slaHours =
      SLA_RESOLUTION_HOURS[d.severity as keyof typeof SLA_RESOLUTION_HOURS] ||
      SLA_RESOLUTION_HOURS.medium
    const createdAt = new Date(d.created_at).getTime()

    if (d.status === "resolved" && d.resolved_at) {
      const resolvedAt = new Date(d.resolved_at).getTime()
      const hoursToResolve = (resolvedAt - createdAt) / (1000 * 60 * 60)
      totalResolutionHours += hoursToResolve
      resolvedCount++
      if (hoursToResolve <= slaHours) onTrack++
      else breached++
    } else {
      // Open deficiency — check if SLA is at risk or breached
      const hoursElapsed = (now - createdAt) / (1000 * 60 * 60)
      if (hoursElapsed > slaHours) breached++
      else if (hoursElapsed > slaHours * 0.75) atRisk++
      else onTrack++
    }
  }

  const avgResolutionHours =
    resolvedCount > 0 ? Math.round(totalResolutionHours / resolvedCount) : null

  return {
    passRateTarget: SLA_PASS_RATE_TARGET,
    passRateCompliance,
    avgCompletionRate,
    avgResolutionHours,
    deficiencySLA: { onTrack, atRisk, breached },
    totalActivitiesAnalysed: closedActivities.length,
  }
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
