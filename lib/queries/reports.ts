import { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

/**
 * Summary stats for the reports page header.
 */
export async function getReportSummary(supabase: SupabaseClient<Database>) {
  const { data: tasks } = await supabase.from("room_tasks").select("status")

  const all = tasks || []
  const total = all.length
  const passed = all.filter((t) => t.status === "inspected_pass").length
  const failed = all.filter((t) => t.status === "inspected_fail").length
  const inspected = passed + failed
  const done = all.filter((t) => t.status === "done").length
  const inProgress = all.filter((t) => t.status === "in_progress").length

  const { count: totalActivities } = await supabase
    .from("cleaning_activities")
    .select("id", { count: "exact", head: true })

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
 * Pass rates grouped by building.
 */
export async function getPassRatesByBuilding(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("room_tasks")
    .select(
      "status, rooms!inner(floors!inner(buildings!inner(id, name)))"
    )
    .in("status", ["inspected_pass", "inspected_fail"])

  if (error) throw error

  const map = new Map<string, { name: string; passed: number; failed: number }>()

  for (const task of data || []) {
    const building = (task.rooms as any)?.floors?.buildings
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
export async function getPassRatesByJanitor(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("room_tasks")
    .select(
      "status, assigned_to, users!room_tasks_assigned_to_fkey(first_name, last_name)"
    )
    .in("status", ["inspected_pass", "inspected_fail"])
    .not("assigned_to", "is", null)

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
 * Activity trend data — pass/fail counts grouped by date.
 */
export async function getActivityTrend(
  supabase: SupabaseClient<Database>,
  days = 30
) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("room_tasks")
    .select(
      "status, cleaning_activities!inner(scheduled_date)"
    )
    .in("status", ["inspected_pass", "inspected_fail", "done"])
    .gte("cleaning_activities.scheduled_date", sinceStr)

  if (error) throw error

  const map = new Map<string, { date: string; passed: number; failed: number; done: number }>()

  for (const task of data || []) {
    const date = (task.cleaning_activities as any)?.scheduled_date
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
  limit = 20
) {
  const { data, error } = await supabase
    .from("cleaning_activities")
    .select(
      "id, name, status, scheduled_date, floors(floor_name, buildings(name)), room_tasks(status)"
    )
    .order("scheduled_date", { ascending: false })
    .limit(limit)

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
        (a.floors as any)?.buildings?.name || "Unknown",
      floorName: (a.floors as any)?.floor_name || "Unknown",
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
