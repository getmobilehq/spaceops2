"use server"

import QRCode from "qrcode"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  createRoomSchema,
  updateRoomSchema,
  deleteRoomSchema,
  createRoomTypeSchema,
  type CreateRoomInput,
  type UpdateRoomInput,
  type DeleteRoomInput,
  type CreateRoomTypeInput,
} from "@/lib/validations/room"

type ActionResult = { success: true } | { success: false; error: string }
type ActionResultWithId =
  | { success: true; id: string }
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

export async function createRoom(
  input: CreateRoomInput
): Promise<ActionResultWithId> {
  const parsed = createRoomSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Insert room
  const { data: room, error: roomError } = await ctx.supabase
    .from("rooms")
    .insert({
      floor_id: parsed.data.floorId,
      org_id: ctx.orgId,
      name: parsed.data.name,
      room_type_id: parsed.data.roomTypeId,
    })
    .select("id")
    .single()

  if (roomError) {
    if (roomError.code === "23505") {
      return { success: false, error: "A room with this name already exists on this floor" }
    }
    return { success: false, error: "Failed to create room" }
  }

  // Generate QR code
  const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan/${room.id}`
  const buffer = await QRCode.toBuffer(scanUrl, {
    type: "png",
    width: 400,
    margin: 2,
    color: { dark: "#0D1B2A", light: "#FFFFFF" },
  })

  const qrPath = `${ctx.orgId}/${room.id}/qr.png`
  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from("qr-codes")
    .upload(qrPath, buffer, { contentType: "image/png", upsert: true })

  if (uploadError) {
    // Room created but QR failed — update path to null and continue
    return { success: true, id: room.id }
  }

  // Update room with QR path
  await ctx.supabase
    .from("rooms")
    .update({ qr_code_url: qrPath })
    .eq("id", room.id)

  return { success: true, id: room.id }
}

export async function updateRoom(
  input: UpdateRoomInput
): Promise<ActionResult> {
  const parsed = updateRoomSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const updateData: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name
  if (parsed.data.roomTypeId !== undefined)
    updateData.room_type_id = parsed.data.roomTypeId
  if (parsed.data.isActive !== undefined)
    updateData.is_active = parsed.data.isActive

  const { error } = await ctx.supabase
    .from("rooms")
    .update(updateData)
    .eq("id", parsed.data.roomId)

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "A room with this name already exists on this floor" }
    }
    return { success: false, error: "Failed to update room" }
  }
  return { success: true }
}

export async function deleteRoom(
  input: DeleteRoomInput
): Promise<ActionResult> {
  const parsed = deleteRoomSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Get QR path before deleting
  const { data: room } = await ctx.supabase
    .from("rooms")
    .select("qr_code_url")
    .eq("id", parsed.data.roomId)
    .single()

  // Delete QR from storage if exists
  if (room?.qr_code_url) {
    const admin = createAdminClient()
    await admin.storage.from("qr-codes").remove([room.qr_code_url])
  }

  const { error } = await ctx.supabase
    .from("rooms")
    .delete()
    .eq("id", parsed.data.roomId)

  if (error) return { success: false, error: "Failed to delete room" }
  return { success: true }
}

export async function regenerateRoomQR(
  roomId: string
): Promise<ActionResult> {
  if (!roomId) return { success: false, error: "Room ID is required" }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan/${roomId}`
  const buffer = await QRCode.toBuffer(scanUrl, {
    type: "png",
    width: 400,
    margin: 2,
    color: { dark: "#0D1B2A", light: "#FFFFFF" },
  })

  const qrPath = `${ctx.orgId}/${roomId}/qr.png`
  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from("qr-codes")
    .upload(qrPath, buffer, { contentType: "image/png", upsert: true })

  if (uploadError) {
    return { success: false, error: "Failed to upload QR code" }
  }

  const { error } = await ctx.supabase
    .from("rooms")
    .update({ qr_code_url: qrPath })
    .eq("id", roomId)

  if (error) return { success: false, error: "Failed to update QR path" }
  return { success: true }
}

export async function createCustomRoomType(
  input: CreateRoomTypeInput
): Promise<ActionResultWithId> {
  const parsed = createRoomTypeSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { data, error } = await ctx.supabase
    .from("room_types")
    .insert({
      org_id: ctx.orgId,
      name: parsed.data.name,
      is_default: false,
    })
    .select("id")
    .single()

  if (error) return { success: false, error: "Failed to create room type" }
  return { success: true, id: data.id }
}
