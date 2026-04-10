import { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export interface ReportFilters {
  dateFrom?: string // YYYY-MM-DD
  dateTo?: string // YYYY-MM-DD
  buildingId?: string // UUID
  clientId?: string // UUID
  floorId?: string // UUID
}

/**
 * Summary stats for the reports page header.
 */
export async function getReportSummary(
  supabase: SupabaseClient<Database>,
  filters?: ReportFilters
) {
  let taskQuery = supabase
    .from("room_tasks")
    .select(
      "status, cleaning_activities!inner(scheduled_date, floors!inner(building_id, buildings!inner(id, client_id)))"
    )

  if (filters?.dateFrom) {
    taskQuery = taskQuery.gte("cleaning_activities.scheduled_date", filters.dateFrom)
  }
  if (filters?.dateTo) {
    taskQuery = taskQuery.lte("cleaning_activities.scheduled_date", filters.dateTo)
  }
  if (filters?.buildingId) {
    taskQuery = taskQuery.eq("cleaning_activities.floors.building_id", filters.buildingId)
  }
  if (filters?.clientId) {
    taskQuery = taskQuery.eq("cleaning_activities.floors.buildings.client_id", filters.clientId)
  }
  if (filters?.floorId) {
    taskQuery = taskQuery.eq("cleaning_activities.floor_id", filters.floorId)
  }

  const { data: tasks } = await taskQuery

  const all = tasks || []
  const total = all.length
  const passed = all.filter((t) => t.status === "inspected_pass").length
  const failed = all.filter((t) => t.status === "inspected_fail").length
  const inspected = passed + failed
  const done = all.filter((t) => t.status === "done").length
  const inProgress = all.filter((t) => t.status === "in_progress").length

  let activityQuery = supabase
    .from("cleaning_activities")
    .select("id, scheduled_date, floors!inner(building_id, buildings!inner(id, client_id))", { count: "exact", head: true })

  if (filters?.dateFrom) {
    activityQuery = activityQuery.gte("scheduled_date", filters.dateFrom)
  }
  if (filters?.dateTo) {
    activityQuery = activityQuery.lte("scheduled_date", filters.dateTo)
  }
  if (filters?.buildingId) {
    activityQuery = activityQuery.eq("floors.building_id", filters.buildingId)
  }
  if (filters?.clientId) {
    activityQuery = activityQuery.eq("floors.buildings.client_id", filters.clientId)
  }
  if (filters?.floorId) {
    activityQuery = activityQuery.eq("floor_id", filters.floorId)
  }

  const { count: totalActivities } = await activityQuery

  const { count: openDeficiencies } = await supabase
    .from("deficiencies")
    .select("id", { count: "exact", head: true })
    .in("status", ["open", "in_progress"])

  return {
    totalTasks: total,
    passedTasks: passed,
    failedTasks: failed,
    inspectedTasks: inspected,
    doneTasks: done,
    inProgressTasks: inProgress,
    passRate: inspected > 0 ? Math.round((passed / inspected) * 100) : null,
    totalActivities: totalActivities ?? 0,
    openDeficiencies: openDeficiencies ?? 0,
  }
}

/**
 * Calculate the previous period filters for comparison.
 * If dateFrom/dateTo set, mirror the same duration backwards.
 * Otherwise, compare last 30 days vs the 30 days before that.
 */
export function getPreviousPeriodFilters(
  filters?: ReportFilters
): ReportFilters {
  if (filters?.dateFrom && filters?.dateTo) {
    const from = new Date(filters.dateFrom)
    const to = new Date(filters.dateTo)
    const durationMs = to.getTime() - from.getTime()
    const prevTo = new Date(from.getTime() - 1) // day before current from
    const prevFrom = new Date(prevTo.getTime() - durationMs)
    return {
      dateFrom: prevFrom.toISOString().split("T")[0],
      dateTo: prevTo.toISOString().split("T")[0],
      buildingId: filters.buildingId,
      clientId: filters.clientId,
      floorId: filters.floorId,
    }
  }

  // Default: last 30 days vs 30 days before that
  const now = new Date()
  const thirtyAgo = new Date(now)
  thirtyAgo.setDate(now.getDate() - 30)
  const sixtyAgo = new Date(now)
  sixtyAgo.setDate(now.getDate() - 60)

  return {
    dateFrom: sixtyAgo.toISOString().split("T")[0],
    dateTo: thirtyAgo.toISOString().split("T")[0],
    buildingId: filters?.buildingId,
    clientId: filters?.clientId,
    floorId: filters?.floorId,
  }
}

/**
 * Pass rates grouped by building.
 */
export async function getPassRatesByBuilding(
  supabase: SupabaseClient<Database>,
  filters?: ReportFilters
) {
  let query = supabase
    .from("room_tasks")
    .select(
      "status, rooms!inner(floors!inner(buildings!inner(id, name, client_id))), cleaning_activities!inner(scheduled_date)"
    )
    .in("status", ["inspected_pass", "inspected_fail"])

  if (filters?.dateFrom) {
    query = query.gte("cleaning_activities.scheduled_date", filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte("cleaning_activities.scheduled_date", filters.dateTo)
  }
  if (filters?.buildingId) {
    query = query.eq("rooms.floors.buildings.id", filters.buildingId)
  }
  if (filters?.clientId) {
    query = query.eq("rooms.floors.buildings.client_id", filters.clientId)
  }
  if (filters?.floorId) {
    query = query.eq("rooms.floor_id", filters.floorId)
  }

  const { data, error } = await query
  if (error) throw error

  const map = new Map<string, { name: string; passed: number; failed: number }>()

  for (const task of data || []) {
    const building = (task.rooms as { floors?: { buildings?: { id: string; name: string } } } | null)?.floors?.buildings
    if (!building) continue
    const key = building.id
    if (!map.has(key)) map.set(key, { name: building.name, passed: 0, failed: 0 })
    const entry = map.get(key)!
    if (task.status === "inspected_pass") entry.passed++
    else entry.failed++
  }

  return Array.from(map.values()).map((b) => ({
    name: b.name,
    passed: b.passed,
    failed: b.failed,
    total: b.passed + b.failed,
    passRate: Math.round((b.passed / (b.passed + b.failed)) * 100),
  }))
}

/**
 * Pass rates grouped by janitor.
 */
export async function getPassRatesByJanitor(
  supabase: SupabaseClient<Database>,
  filters?: ReportFilters
) {
  let query = supabase
    .from("room_tasks")
    .select(
      "status, assigned_to, users!room_tasks_assigned_to_fkey(first_name, last_name), cleaning_activities!inner(scheduled_date, floors!inner(building_id, buildings!inner(id, client_id)))"
    )
    .in("status", ["inspected_pass", "inspected_fail"])
    .not("assigned_to", "is", null)

  if (filters?.dateFrom) {
    query = query.gte("cleaning_activities.scheduled_date", filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte("cleaning_activities.scheduled_date", filters.dateTo)
  }
  if (filters?.buildingId) {
    query = query.eq("cleaning_activities.floors.building_id", filters.buildingId)
  }
  if (filters?.clientId) {
    query = query.eq("cleaning_activities.floors.buildings.client_id", filters.clientId)
  }
  if (filters?.floorId) {
    query = query.eq("cleaning_activities.floor_id", filters.floorId)
  }

  const { data, error } = await query
  if (error) throw error

  const map = new Map<string, { name: string; passed: number; failed: number }>()

  for (const task of data || []) {
    const user = task.users as { first_name: string; last_name: string } | null
    if (!user || !task.assigned_to) continue
    const key = task.assigned_to
    if (!map.has(key))
      map.set(key, { name: `${user.first_name} ${user.last_name}`, passed: 0, failed: 0 })
    const entry = map.get(key)!
    if (task.status === "inspected_pass") entry.passed++
    else entry.failed++
  }

  return Array.from(map.values()).map((j) => ({
    name: j.name,
    passed: j.passed,
    failed: j.failed,
    total: j.passed + j.failed,
    passRate: Math.round((j.passed / (j.passed + j.failed)) * 100),
  }))
}

/**
 * Total time worked by each janitor (sum of completed shifts).
 * Returns array sorted by hours worked descending.
 */
export async function getTimeWorkedByJanitor(
  supabase: SupabaseClient<Database>,
  filters?: ReportFilters
) {
  let query = supabase
    .from("attendance_records")
    .select(
      "user_id, clock_in_at, clock_out_at, building_id, users!attendance_records_user_id_fkey(first_name, last_name), buildings!inner(id, client_id)"
    )
    .not("clock_out_at", "is", null)

  if (filters?.dateFrom) {
    query = query.gte("date", filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte("date", filters.dateTo)
  }
  if (filters?.buildingId) {
    query = query.eq("building_id", filters.buildingId)
  }
  if (filters?.clientId) {
    query = query.eq("buildings.client_id", filters.clientId)
  }

  const { data, error } = await query
  if (error) throw error

  const map = new Map<
    string,
    { name: string; totalMinutes: number; shifts: number }
  >()

  for (const record of data || []) {
    if (!record.clock_out_at) continue
    const user = record.users as { first_name: string; last_name: string } | null
    if (!user) continue

    const minutes =
      (new Date(record.clock_out_at).getTime() -
        new Date(record.clock_in_at).getTime()) /
      60000

    const key = record.user_id
    if (!map.has(key)) {
      map.set(key, {
        name: `${user.first_name} ${user.last_name}`,
        totalMinutes: 0,
        shifts: 0,
      })
    }
    const entry = map.get(key)!
    entry.totalMinutes += minutes
    entry.shifts += 1
  }

  return Array.from(map.values())
    .map((j) => ({
      name: j.name,
      totalMinutes: Math.round(j.totalMinutes),
      hoursWorked: Math.round((j.totalMinutes / 60) * 10) / 10,
      shifts: j.shifts,
      avgShiftHours:
        j.shifts > 0
          ? Math.round((j.totalMinutes / j.shifts / 60) * 10) / 10
          : 0,
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
}

/**
 * Activity trend data — pass/fail counts grouped by date.
 */
export async function getActivityTrend(
  supabase: SupabaseClient<Database>,
  days = 30,
  filters?: ReportFilters
) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = filters?.dateFrom || since.toISOString().split("T")[0]

  let query = supabase
    .from("room_tasks")
    .select(
      "status, cleaning_activities!inner(scheduled_date, floors!inner(building_id, buildings!inner(id, client_id)))"
    )
    .in("status", ["inspected_pass", "inspected_fail", "done"])
    .gte("cleaning_activities.scheduled_date", sinceStr)

  if (filters?.dateTo) {
    query = query.lte("cleaning_activities.scheduled_date", filters.dateTo)
  }
  if (filters?.buildingId) {
    query = query.eq("cleaning_activities.floors.building_id", filters.buildingId)
  }
  if (filters?.clientId) {
    query = query.eq("cleaning_activities.floors.buildings.client_id", filters.clientId)
  }
  if (filters?.floorId) {
    query = query.eq("cleaning_activities.floor_id", filters.floorId)
  }

  const { data, error } = await query
  if (error) throw error

  const map = new Map<string, { date: string; passed: number; failed: number; done: number }>()

  for (const task of data || []) {
    const date = (task.cleaning_activities as { scheduled_date?: string } | null)?.scheduled_date
    if (!date) continue
    if (!map.has(date)) map.set(date, { date, passed: 0, failed: 0, done: 0 })
    const entry = map.get(date)!
    if (task.status === "inspected_pass") entry.passed++
    else if (task.status === "inspected_fail") entry.failed++
    else if (task.status === "done") entry.done++
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Recent activity history with completion stats.
 */
export async function getActivityHistory(
  supabase: SupabaseClient<Database>,
  limit = 20,
  filters?: ReportFilters
) {
  let query = supabase
    .from("cleaning_activities")
    .select(
      "id, name, status, scheduled_date, floors!inner(floor_name, building_id, buildings!inner(id, name, client_id)), room_tasks(status)"
    )
    .order("scheduled_date", { ascending: false })
    .limit(limit)

  if (filters?.dateFrom) {
    query = query.gte("scheduled_date", filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte("scheduled_date", filters.dateTo)
  }
  if (filters?.buildingId) {
    query = query.eq("floors.buildings.id", filters.buildingId)
  }
  if (filters?.clientId) {
    query = query.eq("floors.buildings.client_id", filters.clientId)
  }
  if (filters?.floorId) {
    query = query.eq("floor_id", filters.floorId)
  }

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((a) => {
    const tasks = (a.room_tasks as { status: string }[]) || []
    const total = tasks.length
    const passed = tasks.filter((t) => t.status === "inspected_pass").length
    const failed = tasks.filter((t) => t.status === "inspected_fail").length
    const done = tasks.filter(
      (t) => t.status === "done" || t.status === "inspected_pass" || t.status === "inspected_fail"
    ).length
    const inspected = passed + failed

    return {
      id: a.id,
      name: a.name,
      status: a.status,
      scheduledDate: a.scheduled_date,
      buildingName:
        (a.floors as { floor_name?: string; buildings?: { name?: string } } | null)?.buildings?.name || "Unknown",
      floorName: (a.floors as { floor_name?: string } | null)?.floor_name || "Unknown",
      totalRooms: total,
      completedRooms: done,
      passedRooms: passed,
      failedRooms: failed,
      passRate: inspected > 0 ? Math.round((passed / inspected) * 100) : null,
    }
  })
}

/**
 * Deficiency breakdown by severity.
 */
export async function getDeficiencyBreakdown(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("deficiencies")
    .select("severity, status")

  if (error) throw error

  const all = data || []
  const bySeverity = { low: 0, medium: 0, high: 0 }
  const byStatus = { open: 0, in_progress: 0, resolved: 0 }

  for (const d of all) {
    if (d.severity in bySeverity) bySeverity[d.severity as keyof typeof bySeverity]++
    if (d.status in byStatus) byStatus[d.status as keyof typeof byStatus]++
  }

  return { total: all.length, bySeverity, byStatus }
}

/**
 * Pass rates grouped by client.
 */
export async function getPassRatesByClient(
  supabase: SupabaseClient<Database>,
  filters?: ReportFilters
) {
  let query = supabase
    .from("room_tasks")
    .select(
      "status, rooms!inner(floors!inner(buildings!inner(id, client_id, clients(id, company_name)))), cleaning_activities!inner(scheduled_date)"
    )
    .in("status", ["inspected_pass", "inspected_fail"])

  if (filters?.dateFrom) {
    query = query.gte("cleaning_activities.scheduled_date", filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte("cleaning_activities.scheduled_date", filters.dateTo)
  }
  if (filters?.buildingId) {
    query = query.eq("rooms.floors.buildings.id", filters.buildingId)
  }
  if (filters?.clientId) {
    query = query.eq("rooms.floors.buildings.client_id", filters.clientId)
  }

  const { data, error } = await query
  if (error) throw error

  const map = new Map<string, { name: string; passed: number; failed: number }>()

  for (const task of data || []) {
    const building = (task.rooms as { floors?: { buildings?: { client_id: string | null; clients?: { id: string; company_name: string } | null } } } | null)?.floors?.buildings
    if (!building?.clients) continue
    const key = building.clients.id
    if (!map.has(key)) map.set(key, { name: building.clients.company_name, passed: 0, failed: 0 })
    const entry = map.get(key)!
    if (task.status === "inspected_pass") entry.passed++
    else entry.failed++
  }

  return Array.from(map.values()).map((c) => ({
    name: c.name,
    passed: c.passed,
    failed: c.failed,
    total: c.passed + c.failed,
    passRate: Math.round((c.passed / (c.passed + c.failed)) * 100),
  }))
}

/**
 * Pass rates grouped by floor.
 */
export async function getPassRatesByFloor(
  supabase: SupabaseClient<Database>,
  filters?: ReportFilters
) {
  let query = supabase
    .from("room_tasks")
    .select(
      "status, rooms!inner(floor_id, floors!inner(id, floor_name, buildings!inner(id, name, client_id))), cleaning_activities!inner(scheduled_date)"
    )
    .in("status", ["inspected_pass", "inspected_fail"])

  if (filters?.dateFrom) {
    query = query.gte("cleaning_activities.scheduled_date", filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte("cleaning_activities.scheduled_date", filters.dateTo)
  }
  if (filters?.buildingId) {
    query = query.eq("rooms.floors.buildings.id", filters.buildingId)
  }
  if (filters?.clientId) {
    query = query.eq("rooms.floors.buildings.client_id", filters.clientId)
  }
  if (filters?.floorId) {
    query = query.eq("rooms.floor_id", filters.floorId)
  }

  const { data, error } = await query
  if (error) throw error

  const map = new Map<string, { name: string; buildingName: string; passed: number; failed: number }>()

  for (const task of data || []) {
    const room = task.rooms as { floor_id?: string; floors?: { id: string; floor_name: string; buildings?: { id: string; name: string } } } | null
    const floor = room?.floors
    if (!floor) continue
    const key = floor.id
    if (!map.has(key)) map.set(key, { name: floor.floor_name, buildingName: floor.buildings?.name || "Unknown", passed: 0, failed: 0 })
    const entry = map.get(key)!
    if (task.status === "inspected_pass") entry.passed++
    else entry.failed++
  }

  return Array.from(map.values()).map((f) => ({
    name: f.name,
    buildingName: f.buildingName,
    passed: f.passed,
    failed: f.failed,
    total: f.passed + f.failed,
    passRate: Math.round((f.passed / (f.passed + f.failed)) * 100),
  }))
}

/**
 * Detailed issue report — deficiencies with full location context.
 */
export async function getIssueReport(
  supabase: SupabaseClient<Database>,
  filters?: ReportFilters
) {
  let query = supabase
    .from("deficiencies")
    .select(
      "id, description, severity, status, created_at, reporter:users!deficiencies_reported_by_fkey(first_name, last_name), room_tasks!inner(rooms!inner(name, floors!inner(floor_name, buildings!inner(id, name, client_id))), cleaning_activities!inner(scheduled_date))"
    )
    .order("created_at", { ascending: false })

  if (filters?.dateFrom) {
    query = query.gte("room_tasks.cleaning_activities.scheduled_date", filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte("room_tasks.cleaning_activities.scheduled_date", filters.dateTo)
  }
  if (filters?.buildingId) {
    query = query.eq("room_tasks.rooms.floors.buildings.id", filters.buildingId)
  }
  if (filters?.clientId) {
    query = query.eq("room_tasks.rooms.floors.buildings.client_id", filters.clientId)
  }
  if (filters?.floorId) {
    query = query.eq("room_tasks.rooms.floor_id", filters.floorId)
  }

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((d) => {
    const roomTask = d.room_tasks as { rooms?: { name?: string; floors?: { floor_name?: string; buildings?: { id?: string; name?: string } } } } | null
    const reporter = d.reporter as { first_name: string; last_name: string } | null

    return {
      id: d.id,
      description: d.description,
      severity: d.severity,
      status: d.status,
      createdAt: d.created_at,
      buildingName: roomTask?.rooms?.floors?.buildings?.name || "Unknown",
      floorName: roomTask?.rooms?.floors?.floor_name || "Unknown",
      roomName: roomTask?.rooms?.name || "Unknown",
      reporterName: reporter ? `${reporter.first_name} ${reporter.last_name}` : "Unknown",
    }
  })
}
