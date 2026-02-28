import { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

// ─── Admin Dashboard ───────────────────────────────────────

export async function getAdminDashboardStats(
  supabase: SupabaseClient<Database>
) {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay()) // Sunday
  const weekStartStr = weekStart.toISOString().split("T")[0]
  const weekEndStr = new Date(
    weekStart.getTime() + 6 * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .split("T")[0]

  const [buildingsRes, deficienciesRes, activitiesRes, tasksRes] =
    await Promise.all([
      // Active buildings count
      supabase
        .from("buildings")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),

      // Open deficiencies count
      supabase
        .from("deficiencies")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]),

      // Activities this week
      supabase
        .from("cleaning_activities")
        .select("id", { count: "exact", head: true })
        .gte("scheduled_date", weekStartStr)
        .lte("scheduled_date", weekEndStr),

      // Pass rate (all inspected tasks)
      supabase
        .from("room_tasks")
        .select("status")
        .in("status", ["inspected_pass", "inspected_fail"]),
    ])

  const activeBuildings = buildingsRes.count || 0
  const openDeficiencies = deficienciesRes.count || 0
  const activitiesThisWeek = activitiesRes.count || 0

  const inspected = tasksRes.data || []
  const passed = inspected.filter((t) => t.status === "inspected_pass").length
  const avgPassRate =
    inspected.length > 0 ? Math.round((passed / inspected.length) * 100) : null

  return { activeBuildings, openDeficiencies, activitiesThisWeek, avgPassRate }
}

export async function getRecentActivity(
  supabase: SupabaseClient<Database>,
  limit = 10
) {
  // Recent activities with their status
  const { data: activities } = await supabase
    .from("cleaning_activities")
    .select(
      "id, name, status, scheduled_date, created_at, floors(floor_name, buildings(name))"
    )
    .order("created_at", { ascending: false })
    .limit(limit)

  // Recent deficiencies
  const { data: deficiencies } = await supabase
    .from("deficiencies")
    .select(
      "id, description, severity, status, created_at, room_tasks(rooms(name))"
    )
    .order("created_at", { ascending: false })
    .limit(limit)

  // Merge and sort by created_at
  const events: {
    type: "activity" | "deficiency"
    id: string
    title: string
    subtitle: string
    status: string
    severity?: string
    createdAt: string
  }[] = []

  for (const a of activities || []) {
    const building = a.floors?.buildings?.name || "Unknown"
    const floor = a.floors?.floor_name || ""
    events.push({
      type: "activity",
      id: a.id,
      title: a.name,
      subtitle: `${building} · ${floor}`,
      status: a.status,
      createdAt: a.created_at,
    })
  }

  for (const d of deficiencies || []) {
    const room = d.room_tasks?.rooms?.name || "Unknown room"
    events.push({
      type: "deficiency",
      id: d.id,
      title: d.description.length > 60 ? d.description.slice(0, 60) + "..." : d.description,
      subtitle: room,
      status: d.status,
      severity: d.severity,
      createdAt: d.created_at,
    })
  }

  events.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return events.slice(0, limit)
}

// ─── Supervisor Dashboard ──────────────────────────────────

export async function getSupervisorDashboardStats(
  supabase: SupabaseClient<Database>
) {
  const today = new Date().toISOString().split("T")[0]

  const [pendingRes, issuesRes] = await Promise.all([
    // Rooms pending inspection: tasks with status "done" in today's active activities
    supabase
      .from("room_tasks")
      .select(
        "id, cleaning_activities!inner(scheduled_date, status)"
      )
      .eq("status", "done")
      .eq("cleaning_activities.status", "active"),

    // Open issues: deficiencies that are open or in_progress
    supabase
      .from("deficiencies")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]),
  ])

  const pendingInspection = pendingRes.data?.length || 0
  const openIssues = issuesRes.count || 0

  return { pendingInspection, openIssues }
}

export async function getTodayActivityDetails(
  supabase: SupabaseClient<Database>
) {
  const today = new Date().toISOString().split("T")[0]

  const { data } = await supabase
    .from("cleaning_activities")
    .select(
      "id, name, status, window_start, window_end, floors(floor_name, buildings(name)), room_tasks(id, status)"
    )
    .eq("scheduled_date", today)
    .in("status", ["draft", "active"])
    .order("window_start", { ascending: true })

  return (data || []).map((a) => {
    const tasks = a.room_tasks || []
    const total = tasks.length
    const done = tasks.filter(
      (t: { status: string }) =>
        t.status === "done" ||
        t.status === "inspected_pass" ||
        t.status === "inspected_fail"
    ).length
    const pending = tasks.filter(
      (t: { status: string }) => t.status === "done"
    ).length

    return {
      id: a.id,
      name: a.name,
      status: a.status,
      windowStart: a.window_start,
      windowEnd: a.window_end,
      building: a.floors?.buildings?.name || "Unknown",
      floor: a.floors?.floor_name || "",
      totalRooms: total,
      completedRooms: done,
      pendingInspection: pending,
    }
  })
}
