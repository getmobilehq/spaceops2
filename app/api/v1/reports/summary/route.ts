import { type NextRequest } from "next/server"
import { authenticateApiKey } from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rate-limit"
import { createAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-helpers"

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.success) return apiError(auth.error, auth.status)

  const rl = checkRateLimit(auth.ctx.keyId)
  if (!rl.allowed) return apiError("Rate limit exceeded", 429)

  const { searchParams } = request.nextUrl
  const dateFrom = searchParams.get("date_from") || undefined
  const dateTo = searchParams.get("date_to") || undefined

  const admin = createAdminClient()

  // Fetch tasks via inner join on cleaning_activities
  let taskQuery = admin
    .from("room_tasks")
    .select("status, cleaning_activities!inner(org_id, scheduled_date)")
    .eq("cleaning_activities.org_id", auth.ctx.orgId)

  if (dateFrom)
    taskQuery = taskQuery.gte("cleaning_activities.scheduled_date", dateFrom)
  if (dateTo)
    taskQuery = taskQuery.lte("cleaning_activities.scheduled_date", dateTo)

  const { data: tasks } = await taskQuery
  const all = tasks || []
  const total = all.length
  const passed = all.filter((t) => t.status === "inspected_pass").length
  const failed = all.filter((t) => t.status === "inspected_fail").length
  const inspected = passed + failed
  const done = all.filter((t) => t.status === "done").length

  // Activity count
  let actQuery = admin
    .from("cleaning_activities")
    .select("id", { count: "exact", head: true })
    .eq("org_id", auth.ctx.orgId)

  if (dateFrom) actQuery = actQuery.gte("scheduled_date", dateFrom)
  if (dateTo) actQuery = actQuery.lte("scheduled_date", dateTo)

  const { count: totalActivities } = await actQuery

  return apiSuccess({
    totalTasks: total,
    passedTasks: passed,
    failedTasks: failed,
    completedTasks: done,
    passRate: inspected > 0 ? Math.round((passed / inspected) * 100) : null,
    totalActivities: totalActivities ?? 0,
    period: { from: dateFrom || null, to: dateTo || null },
  })
}
