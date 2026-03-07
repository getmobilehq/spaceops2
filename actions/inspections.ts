"use server"

import { createClient } from "@/lib/supabase/server"
import {
  createInspectionSchema,
  completeInspectionSchema,
  scanInspectionRoomSchema,
  type CreateInspectionInput,
  type CompleteInspectionInput,
  type ScanInspectionRoomInput,
} from "@/lib/validations/inspection"

type ActionResult = { success: true } | { success: false; error: string }
type ActionResultWithId =
  | { success: true; id: string }
  | { success: false; error: string }

async function getSupervisorContext() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const role = user.app_metadata?.role as string | undefined
  const orgId = user.app_metadata?.org_id as string | undefined
  if (!orgId || (role !== "admin" && role !== "supervisor")) return null
  return { user, orgId, supabase }
}

export async function createInspection(
  input: CreateInspectionInput
): Promise<ActionResultWithId> {
  const parsed = createInspectionSchema.safeParse(input)
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Verify building assignment
  const { data: assignments } = await ctx.supabase
    .from("building_supervisors")
    .select("building_id")
    .eq("user_id", ctx.user.id)
    .eq("building_id", parsed.data.buildingId)

  // Admins bypass building assignment check
  const role = ctx.user.app_metadata?.role
  if (role !== "admin" && (!assignments || assignments.length === 0)) {
    return { success: false, error: "You are not assigned to this building" }
  }

  const { data: inspection, error } = await ctx.supabase
    .from("inspections")
    .insert({
      org_id: ctx.orgId,
      building_id: parsed.data.buildingId,
      floor_id: parsed.data.floorId,
      room_id: parsed.data.roomId,
      inspector_id: ctx.user.id,
      status: "pending",
    })
    .select("id")
    .single()

  if (error) return { success: false, error: "Failed to create inspection" }
  return { success: true, id: inspection.id }
}

export async function scanInspectionRoom(
  input: ScanInspectionRoomInput
): Promise<ActionResult> {
  const parsed = scanInspectionRoomSchema.safeParse(input)
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { data: inspection } = await ctx.supabase
    .from("inspections")
    .select("id, room_id, status")
    .eq("id", parsed.data.inspectionId)
    .single()

  if (!inspection) return { success: false, error: "Inspection not found" }
  if (inspection.room_id !== parsed.data.roomId) {
    return {
      success: false,
      error: "Wrong room! This QR code belongs to a different room.",
    }
  }

  const { error } = await ctx.supabase
    .from("inspections")
    .update({ inspection_scan_at: new Date().toISOString() })
    .eq("id", parsed.data.inspectionId)

  if (error) return { success: false, error: "Failed to record scan" }
  return { success: true }
}

export async function completeInspection(
  input: CompleteInspectionInput
): Promise<ActionResult> {
  const parsed = completeInspectionSchema.safeParse(input)
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { data: inspection } = await ctx.supabase
    .from("inspections")
    .select("id, status, inspection_scan_at")
    .eq("id", parsed.data.inspectionId)
    .single()

  if (!inspection) return { success: false, error: "Inspection not found" }
  if (inspection.status !== "pending") {
    return { success: false, error: "Inspection already completed" }
  }
  if (!inspection.inspection_scan_at) {
    return {
      success: false,
      error: "Scan the room QR code before completing the inspection",
    }
  }

  const { error } = await ctx.supabase
    .from("inspections")
    .update({
      status: parsed.data.result,
      notes: parsed.data.notes ?? null,
      inspected_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.inspectionId)

  if (error) return { success: false, error: "Failed to complete inspection" }
  return { success: true }
}
