"use server"

import { createClient } from "@/lib/supabase/server"
import {
  createActivityTemplateSchema,
  updateActivityTemplateSchema,
  deleteActivityTemplateSchema,
  saveActivityAsTemplateSchema,
  type CreateActivityTemplateInput,
  type UpdateActivityTemplateInput,
  type DeleteActivityTemplateInput,
  type SaveActivityAsTemplateInput,
} from "@/lib/validations/activity-template"

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

export async function createActivityTemplate(
  input: CreateActivityTemplateInput
): Promise<ActionResultWithId> {
  const parsed = createActivityTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { data, error } = await ctx.supabase
    .from("activity_templates")
    .insert({
      org_id: ctx.orgId,
      created_by: ctx.user.id,
      name: parsed.data.name,
      floor_id: parsed.data.floorId,
      window_start: parsed.data.windowStart,
      window_end: parsed.data.windowEnd,
      notes: parsed.data.notes ?? null,
      default_assignments: parsed.data.defaultAssignments,
    })
    .select("id")
    .single()

  if (error) return { success: false, error: "Failed to create template" }
  return { success: true, id: data.id }
}

export async function updateActivityTemplate(
  input: UpdateActivityTemplateInput
): Promise<ActionResult> {
  const parsed = updateActivityTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const updateData: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name
  if (parsed.data.windowStart !== undefined)
    updateData.window_start = parsed.data.windowStart
  if (parsed.data.windowEnd !== undefined)
    updateData.window_end = parsed.data.windowEnd
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes
  if (parsed.data.defaultAssignments !== undefined)
    updateData.default_assignments = parsed.data.defaultAssignments

  const { error } = await ctx.supabase
    .from("activity_templates")
    .update(updateData)
    .eq("id", parsed.data.templateId)

  if (error) return { success: false, error: "Failed to update template" }
  return { success: true }
}

export async function deleteActivityTemplate(
  input: DeleteActivityTemplateInput
): Promise<ActionResult> {
  const parsed = deleteActivityTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { error } = await ctx.supabase
    .from("activity_templates")
    .delete()
    .eq("id", parsed.data.templateId)

  if (error) return { success: false, error: "Failed to delete template" }
  return { success: true }
}

export async function saveActivityAsTemplate(
  input: SaveActivityAsTemplateInput
): Promise<ActionResultWithId> {
  const parsed = saveActivityAsTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Fetch activity with room tasks
  const { data: activity, error: fetchError } = await ctx.supabase
    .from("cleaning_activities")
    .select("floor_id, window_start, window_end, notes, room_tasks(room_id, assigned_to)")
    .eq("id", parsed.data.activityId)
    .single()

  if (fetchError || !activity) {
    return { success: false, error: "Activity not found" }
  }

  // Build default assignments from current room task assignments
  const defaultAssignments = (activity.room_tasks || [])
    .filter((t: { assigned_to: string | null }) => t.assigned_to)
    .map((t: { room_id: string; assigned_to: string | null }) => ({
      room_id: t.room_id,
      assigned_to: t.assigned_to,
    }))

  const { data, error } = await ctx.supabase
    .from("activity_templates")
    .insert({
      org_id: ctx.orgId,
      created_by: ctx.user.id,
      name: parsed.data.name,
      floor_id: activity.floor_id,
      window_start: activity.window_start,
      window_end: activity.window_end,
      notes: activity.notes,
      default_assignments: defaultAssignments,
    })
    .select("id")
    .single()

  if (error) return { success: false, error: "Failed to save as template" }
  return { success: true, id: data.id }
}
