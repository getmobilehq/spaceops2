import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/types"

export type UsageEventType = "ai_vectorisation" | "ai_report" | "api_call"

interface UsageEventInput {
  orgId: string
  eventType: UsageEventType
  metadata?: Record<string, Json>
}

/**
 * Record a usage event. Fire-and-forget — failures are logged but do not
 * propagate errors to the caller.
 */
export async function recordUsageEvent(input: UsageEventInput): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from("usage_events").insert({
      org_id: input.orgId,
      event_type: input.eventType,
      metadata: (input.metadata || {}) as Json,
    })
  } catch (err) {
    console.error("Failed to record usage event:", err)
  }
}
