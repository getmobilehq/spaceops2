"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  createBuildingSchema,
  updateBuildingSchema,
  assignSupervisorSchema,
  removeSupervisorSchema,
  type CreateBuildingInput,
  type UpdateBuildingInput,
  type AssignSupervisorInput,
  type RemoveSupervisorInput,
} from "@/lib/validations/building"

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

export async function createBuilding(
  input: CreateBuildingInput
): Promise<ActionResultWithId> {
  const parsed = createBuildingSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // 1. Insert building
  const { data: building, error: buildingError } = await ctx.supabase
    .from("buildings")
    .insert({
      org_id: ctx.orgId,
      client_id: parsed.data.clientId,
      name: parsed.data.name,
      address: parsed.data.address,
      status: "setup",
    })
    .select("id")
    .single()

  if (buildingError || !building) {
    return { success: false, error: "Failed to create building" }
  }

  // 2. Insert floors
  const floorRows = parsed.data.floors.map((f) => ({
    building_id: building.id,
    org_id: ctx.orgId,
    floor_number: f.floorNumber,
    floor_name: f.floorName,
  }))

  const { error: floorsError } = await ctx.supabase
    .from("floors")
    .insert(floorRows)

  if (floorsError) {
    // Rollback: delete the building (cascades floors)
    await ctx.supabase.from("buildings").delete().eq("id", building.id)
    return { success: false, error: "Failed to create floors" }
  }

  return { success: true, id: building.id }
}

export async function updateBuilding(
  input: UpdateBuildingInput
): Promise<ActionResult> {
  const parsed = updateBuildingSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const updateData: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name
  if (parsed.data.address !== undefined)
    updateData.address = parsed.data.address
  if (parsed.data.clientId !== undefined)
    updateData.client_id = parsed.data.clientId
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status

  const { error } = await ctx.supabase
    .from("buildings")
    .update(updateData)
    .eq("id", parsed.data.buildingId)

  if (error) return { success: false, error: "Failed to update building" }
  return { success: true }
}

export async function assignSupervisor(
  input: AssignSupervisorInput
): Promise<ActionResult> {
  const parsed = assignSupervisorSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Verify user is a supervisor in the same org
  const { data: targetUser, error: userError } = await ctx.supabase
    .from("users")
    .select("role, org_id")
    .eq("id", parsed.data.userId)
    .single()

  if (userError || !targetUser) {
    return { success: false, error: "User not found" }
  }
  if (targetUser.org_id !== ctx.orgId) {
    return { success: false, error: "Unauthorized" }
  }
  if (targetUser.role !== "supervisor" && targetUser.role !== "admin") {
    return { success: false, error: "User must have the supervisor or admin role" }
  }

  const { error } = await ctx.supabase
    .from("building_supervisors")
    .insert({
      building_id: parsed.data.buildingId,
      user_id: parsed.data.userId,
    })

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Supervisor already assigned" }
    }
    return { success: false, error: "Failed to assign supervisor" }
  }

  return { success: true }
}

export async function removeSupervisor(
  input: RemoveSupervisorInput
): Promise<ActionResult> {
  const parsed = removeSupervisorSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { error } = await ctx.supabase
    .from("building_supervisors")
    .delete()
    .eq("building_id", parsed.data.buildingId)
    .eq("user_id", parsed.data.userId)

  if (error) return { success: false, error: "Failed to remove supervisor" }
  return { success: true }
}

export async function uploadFloorPlan(
  formData: FormData
): Promise<ActionResult> {
  const floorId = formData.get("floorId") as string | null
  const buildingId = formData.get("buildingId") as string | null
  const file = formData.get("plan") as File | null

  if (!floorId || !buildingId || !file || file.size === 0) {
    return { success: false, error: "Missing required fields" }
  }

  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Invalid file type. Upload JPEG, PNG, WebP, or PDF",
    }
  }
  if (file.size > MAX_SIZE) {
    return { success: false, error: "File must be smaller than 10MB" }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const ext = file.name.split(".").pop() || "png"
  const filePath = `${ctx.orgId}/${buildingId}/${floorId}/original.${ext}`

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from("floor-plans")
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    return { success: false, error: "Failed to upload floor plan" }
  }

  // Upsert vectorised_plans record
  const { error: planError } = await ctx.supabase
    .from("vectorised_plans")
    .upsert(
      {
        floor_id: floorId,
        org_id: ctx.orgId,
        original_path: filePath,
      },
      { onConflict: "floor_id" }
    )

  if (planError) {
    return { success: false, error: "Failed to save plan record" }
  }

  // Update floor plan_status to 'uploaded'
  const { error: floorError } = await ctx.supabase
    .from("floors")
    .update({ plan_status: "uploaded" })
    .eq("id", floorId)

  if (floorError) {
    return { success: false, error: "Failed to update floor status" }
  }

  return { success: true }
}

export async function confirmFloorPlan(
  floorId: string
): Promise<ActionResult> {
  if (!floorId) return { success: false, error: "Floor ID is required" }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { error } = await ctx.supabase
    .from("floors")
    .update({ plan_status: "confirmed" })
    .eq("id", floorId)

  if (error) return { success: false, error: "Failed to confirm floor plan" }
  return { success: true }
}
