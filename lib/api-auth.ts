import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { canAccess } from "@/lib/plans"
import { recordUsageEvent } from "@/lib/usage"
import type { NextRequest } from "next/server"

export interface ApiContext {
  orgId: string
  keyId: string
  plan: "free" | "pro" | "enterprise"
}

export type ApiAuthResult =
  | { success: true; ctx: ApiContext }
  | { success: false; status: number; error: string }

export async function authenticateApiKey(
  request: NextRequest
): Promise<ApiAuthResult> {
  const apiKey = request.headers.get("x-api-key")

  if (!apiKey) {
    return { success: false, status: 401, error: "Missing x-api-key header" }
  }

  if (!apiKey.startsWith("spops_")) {
    return { success: false, status: 401, error: "Invalid API key format" }
  }

  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex")
  const admin = createAdminClient()

  const { data: keyRecord } = await admin
    .from("api_keys")
    .select("id, org_id, revoked_at")
    .eq("key_hash", keyHash)
    .single()

  if (!keyRecord) {
    return { success: false, status: 401, error: "Invalid API key" }
  }

  if (keyRecord.revoked_at) {
    return { success: false, status: 401, error: "API key has been revoked" }
  }

  const { data: org } = await admin
    .from("organisations")
    .select("plan")
    .eq("id", keyRecord.org_id)
    .single()

  if (!org) {
    return { success: false, status: 401, error: "Organisation not found" }
  }

  const plan = (org.plan as "free" | "pro" | "enterprise") || "free"
  if (!canAccess("api_access", plan)) {
    return {
      success: false,
      status: 403,
      error: "API access requires an Enterprise plan",
    }
  }

  // Update last_used_at (fire-and-forget)
  void admin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRecord.id)
    .then(() => {})

  // Record API call usage event (fire-and-forget)
  recordUsageEvent({
    orgId: keyRecord.org_id,
    eventType: "api_call",
    metadata: {
      endpoint: request.nextUrl.pathname,
      method: request.method,
    },
  })

  return {
    success: true,
    ctx: {
      orgId: keyRecord.org_id,
      keyId: keyRecord.id,
      plan,
    },
  }
}
