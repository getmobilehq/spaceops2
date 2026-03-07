"use server"

import QRCode from "qrcode"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/types"
import {
  vectoriseFloorPlanSchema,
  applyVectorisationSchema,
  type VectoriseFloorPlanInput,
  type ApplyVectorisationInput,
  type ExtractionResult,
} from "@/lib/validations/vectorisation"
import { extractRoomsFromFloorPlan } from "@/lib/vectorisation/extract-rooms"

type ActionResult = { success: true } | { success: false; error: string }
type VectoriseResult =
  | { success: true; data: ExtractionResult }
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

export async function vectoriseFloorPlan(
  input: VectoriseFloorPlanInput
): Promise<VectoriseResult> {
  const parsed = vectoriseFloorPlanSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Check plan allows AI vectorisation
  const { data: orgData } = await ctx.supabase
    .from("organisations")
    .select("plan")
    .eq("id", ctx.orgId)
    .single()

  const { canAccess } = await import("@/lib/plans")
  if (!canAccess("ai_vectorisation", (orgData?.plan as "free" | "pro" | "enterprise") || "free")) {
    return {
      success: false,
      error: "AI floor plan vectorisation requires a Pro or Enterprise plan.",
    }
  }

  // Fetch the vectorised_plans row for this floor
  const { data: plan, error: planError } = await ctx.supabase
    .from("vectorised_plans")
    .select("id, original_path, extraction_status")
    .eq("floor_id", parsed.data.floorId)
    .single()

  if (planError || !plan) {
    return { success: false, error: "No floor plan found. Please upload one first." }
  }

  if (plan.extraction_status === "processing") {
    return { success: false, error: "Extraction is already in progress." }
  }

  // Set status to processing
  await ctx.supabase
    .from("vectorised_plans")
    .update({
      extraction_status: "processing",
      extraction_error: null,
    })
    .eq("id", plan.id)

  try {
    const result = await extractRoomsFromFloorPlan(ctx.supabase, plan.original_path)

    // Record usage event (fire-and-forget)
    const { recordUsageEvent } = await import("@/lib/usage")
    recordUsageEvent({
      orgId: ctx.orgId,
      eventType: "ai_vectorisation",
      metadata: { floorId: parsed.data.floorId as string },
    })

    // Store results
    await ctx.supabase
      .from("vectorised_plans")
      .update({
        extracted_data: result as unknown as Json,
        extraction_status: "completed",
        extraction_error: null,
        extracted_at: new Date().toISOString(),
      })
      .eq("id", plan.id)

    // Update floor plan_status to vectorised
    await ctx.supabase
      .from("floors")
      .update({ plan_status: "vectorised" })
      .eq("id", parsed.data.floorId)

    return { success: true, data: result }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error during extraction"

    await ctx.supabase
      .from("vectorised_plans")
      .update({
        extraction_status: "failed",
        extraction_error: message,
      })
      .eq("id", plan.id)

    return { success: false, error: message }
  }
}

export async function applyVectorisation(
  input: ApplyVectorisationInput
): Promise<ActionResult> {
  const parsed = applyVectorisationSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const admin = createAdminClient()

  for (const room of parsed.data.rooms) {
    if (room.action === "skip") continue

    if (room.action === "match" && room.matchedRoomId) {
      // Update existing room pin to the extracted position
      const { error } = await ctx.supabase
        .from("rooms")
        .update({ pin_x: room.x, pin_y: room.y })
        .eq("id", room.matchedRoomId)

      if (error) {
        return { success: false, error: `Failed to update room position: ${error.message}` }
      }
    }

    if (room.action === "create") {
      const roomName = room.overrideName || room.label

      // Get room type — use provided one or fall back to "Other" default
      let roomTypeId = room.roomTypeId
      if (!roomTypeId) {
        const { data: defaultType } = await ctx.supabase
          .from("room_types")
          .select("id")
          .eq("name", "Office")
          .eq("is_default", true)
          .limit(1)
          .single()
        if (!defaultType) {
          const { data: anyType } = await ctx.supabase
            .from("room_types")
            .select("id")
            .limit(1)
            .single()
          roomTypeId = anyType?.id
        } else {
          roomTypeId = defaultType.id
        }
      }

      if (!roomTypeId) {
        return { success: false, error: `No room type available for "${roomName}"` }
      }

      // Create the room
      const { data: newRoom, error: roomError } = await ctx.supabase
        .from("rooms")
        .insert({
          floor_id: parsed.data.floorId,
          org_id: ctx.orgId,
          name: roomName,
          room_type_id: roomTypeId,
          pin_x: room.x,
          pin_y: room.y,
        })
        .select("id")
        .single()

      if (roomError) {
        return {
          success: false,
          error: `Failed to create room "${roomName}": ${roomError.message}`,
        }
      }

      // Generate QR code for the new room
      try {
        const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan/${newRoom.id}`
        const buffer = await QRCode.toBuffer(scanUrl, {
          type: "png",
          width: 400,
          margin: 2,
          color: { dark: "#0D1B2A", light: "#FFFFFF" },
        })

        const qrPath = `${ctx.orgId}/${newRoom.id}/qr.png`
        const { error: uploadError } = await admin.storage
          .from("qr-codes")
          .upload(qrPath, buffer, {
            contentType: "image/png",
            upsert: true,
          })

        if (!uploadError) {
          await ctx.supabase
            .from("rooms")
            .update({ qr_code_url: qrPath })
            .eq("id", newRoom.id)
        }
      } catch {
        // QR generation failure is non-critical, continue
      }
    }
  }

  // Update floor plan_status to confirmed
  await ctx.supabase
    .from("floors")
    .update({ plan_status: "confirmed" })
    .eq("id", parsed.data.floorId)

  return { success: true }
}
