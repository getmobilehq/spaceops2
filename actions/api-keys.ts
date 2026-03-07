"use server"

import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"
import { canAccess } from "@/lib/plans"
import {
  createApiKeySchema,
  revokeApiKeySchema,
  type CreateApiKeyInput,
  type RevokeApiKeyInput,
} from "@/lib/validations/api-key"

type ActionResult = { success: true } | { success: false; error: string }
type CreateKeyResult =
  | { success: true; key: string; keyId: string }
  | { success: false; error: string }

async function getAdminContext() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const role = user.app_metadata?.role as string | undefined
  const orgId = user.app_metadata?.org_id as string | undefined

  if (role !== "admin" || !orgId) return null

  return { user, orgId, supabase }
}

export async function createApiKey(
  input: CreateApiKeyInput
): Promise<CreateKeyResult> {
  const parsed = createApiKeySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Check plan allows API access
  const { data: orgData } = await ctx.supabase
    .from("organisations")
    .select("plan")
    .eq("id", ctx.orgId)
    .single()

  if (
    !canAccess(
      "api_access",
      (orgData?.plan as "free" | "pro" | "enterprise") || "free"
    )
  ) {
    return {
      success: false,
      error: "API access requires an Enterprise plan.",
    }
  }

  // Generate key: spops_ + 40 random hex chars
  const randomPart = crypto.randomBytes(20).toString("hex")
  const fullKey = `spops_${randomPart}`
  const keyPrefix = fullKey.substring(0, 12)
  const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex")

  const { data, error } = await ctx.supabase
    .from("api_keys")
    .insert({
      org_id: ctx.orgId,
      name: parsed.data.name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
    })
    .select("id")
    .single()

  if (error) {
    return { success: false, error: "Failed to create API key" }
  }

  return { success: true, key: fullKey, keyId: data.id }
}

export async function revokeApiKey(
  input: RevokeApiKeyInput
): Promise<ActionResult> {
  const parsed = revokeApiKeySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { error } = await ctx.supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", parsed.data.keyId)
    .is("revoked_at", null)

  if (error) {
    return { success: false, error: "Failed to revoke API key" }
  }

  return { success: true }
}
