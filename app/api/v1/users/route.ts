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
  const role = searchParams.get("role")
  const activeOnly = searchParams.get("active") !== "false"

  const admin = createAdminClient()
  let query = admin
    .from("users")
    .select(
      "id, first_name, last_name, role, is_active, avatar_url, created_at"
    )
    .eq("org_id", auth.ctx.orgId)
    .order("created_at", { ascending: true })

  if (role) query = query.eq("role", role as "admin" | "supervisor" | "janitor" | "client")
  if (activeOnly) query = query.eq("is_active", true)

  const { data, error } = await query

  if (error) return apiError("Failed to fetch users", 500)

  return apiSuccess(data)
}
