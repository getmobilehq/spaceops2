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
  const dateFrom = searchParams.get("date_from")
  const dateTo = searchParams.get("date_to")
  const status = searchParams.get("status")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
  const offset = parseInt(searchParams.get("offset") || "0")

  const admin = createAdminClient()
  let query = admin
    .from("cleaning_activities")
    .select(
      "id, name, status, scheduled_date, window_start, window_end, created_at",
      { count: "exact" }
    )
    .eq("org_id", auth.ctx.orgId)
    .order("scheduled_date", { ascending: false })
    .range(offset, offset + limit - 1)

  if (dateFrom) query = query.gte("scheduled_date", dateFrom)
  if (dateTo) query = query.lte("scheduled_date", dateTo)
  if (status) query = query.eq("status", status as "draft" | "active" | "closed" | "cancelled")

  const { data, error, count } = await query

  if (error) return apiError("Failed to fetch activities", 500)

  return apiSuccess({ activities: data, total: count, limit, offset })
}
