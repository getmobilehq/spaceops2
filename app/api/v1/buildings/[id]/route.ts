import { type NextRequest } from "next/server"
import { authenticateApiKey } from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rate-limit"
import { createAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError } from "@/lib/api-helpers"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateApiKey(request)
  if (!auth.success) return apiError(auth.error, auth.status)

  const rl = checkRateLimit(auth.ctx.keyId)
  if (!rl.allowed) return apiError("Rate limit exceeded", 429)

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("buildings")
    .select(
      "id, name, address, status, client_id, latitude, longitude, geofence_radius_m, created_at, floors(id, floor_number, floor_name)"
    )
    .eq("id", params.id)
    .eq("org_id", auth.ctx.orgId)
    .single()

  if (error || !data) return apiError("Building not found", 404)

  return apiSuccess(data)
}
