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

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("buildings")
    .select(
      "id, name, address, status, client_id, latitude, longitude, geofence_radius_m, created_at"
    )
    .eq("org_id", auth.ctx.orgId)
    .order("created_at", { ascending: false })

  if (error) return apiError("Failed to fetch buildings", 500)

  return apiSuccess(data)
}
