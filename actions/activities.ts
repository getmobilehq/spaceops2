"use server"

import { createClient } from "@/lib/supabase/server"
import {
  createActivitySchema,
  updateActivitySchema,
  assignRoomTasksSchema,
  publishActivitySchema,
  cancelActivitySchema,
  closeActivitySchema,
  updateRoomTaskStatusSchema,
  inspectRoomTaskSchema,
  type CreateActivityInput,
  type UpdateActivityInput,
  type AssignRoomTasksInput,
  type PublishActivityInput,
  type CancelActivityInput,
  type CloseActivityInput,
  type UpdateRoomTaskStatusInput,
  type InspectRoomTaskInput,
} from "@/lib/validations/activity"

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

async function getAuthContext() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const orgId = user.app_metadata?.org_id as string | undefined
  if (!orgId) return null

  return { user, orgId, supabase }
}

export async function createActivity(
  input: CreateActivityInput
): Promise<ActionResultWithId> {
  const parsed = createActivitySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Insert activity
  const { data: activity, error: activityError } = await ctx.supabase
    .from("cleaning_activities")
    .insert({
      org_id: ctx.orgId,
      floor_id: parsed.data.floorId,
      created_by: ctx.user.id,
      name: parsed.data.name,
      scheduled_date: parsed.data.scheduledDate,
      window_start: parsed.data.windowStart,
      window_end: parsed.data.windowEnd,
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single()

  if (activityError) {
    return { success: false, error: "Failed to create activity" }
  }

  // Auto-create room_tasks for all active rooms on this floor
  const { data: rooms } = await ctx.supabase
    .from("rooms")
    .select("id")
    .eq("floor_id", parsed.data.floorId)
    .eq("is_active", true)

  if (rooms && rooms.length > 0) {
    const tasks = rooms.map((room) => ({
      activity_id: activity.id,
      room_id: room.id,
      org_id: ctx.orgId,
    }))

    await ctx.supabase.from("room_tasks").insert(tasks)
  }

  return { success: true, id: activity.id }
}

export async function updateActivity(
  input: UpdateActivityInput
): Promise<ActionResult> {
  const parsed = updateActivitySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Only allow editing draft activities
  const { data: existing } = await ctx.supabase
    .from("cleaning_activities")
    .select("status")
    .eq("id", parsed.data.activityId)
    .single()

  if (!existing || existing.status !== "draft") {
    return { success: false, error: "Can only edit draft activities" }
  }

  const updateData: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name
  if (parsed.data.scheduledDate !== undefined)
    updateData.scheduled_date = parsed.data.scheduledDate
  if (parsed.data.windowStart !== undefined)
    updateData.window_start = parsed.data.windowStart
  if (parsed.data.windowEnd !== undefined)
    updateData.window_end = parsed.data.windowEnd
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes

  const { error } = await ctx.supabase
    .from("cleaning_activities")
    .update(updateData)
    .eq("id", parsed.data.activityId)

  if (error) return { success: false, error: "Failed to update activity" }
  return { success: true }
}

export async function assignRoomTasks(
  input: AssignRoomTasksInput
): Promise<ActionResult> {
  const parsed = assignRoomTasksSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const updates = parsed.data.assignments.map((a) =>
    ctx.supabase
      .from("room_tasks")
      .update({ assigned_to: a.assignedTo })
      .eq("activity_id", parsed.data.activityId)
      .eq("room_id", a.roomId)
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) {
    return { success: false, error: "Failed to assign rooms" }
  }

  return { success: true }
}

export async function publishActivity(
  input: PublishActivityInput
): Promise<ActionResult> {
  const parsed = publishActivitySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Verify at least one room has an assignee
  const { data: tasks } = await ctx.supabase
    .from("room_tasks")
    .select("assigned_to")
    .eq("activity_id", parsed.data.activityId)
    .not("assigned_to", "is", null)

  if (!tasks || tasks.length === 0) {
    return {
      success: false,
      error: "Assign at least one janitor before publishing",
    }
  }

  const { error } = await ctx.supabase
    .from("cleaning_activities")
    .update({ status: "active" })
    .eq("id", parsed.data.activityId)
    .eq("status", "draft")

  if (error) return { success: false, error: "Failed to publish activity" }
  return { success: true }
}

export async function cancelActivity(
  input: CancelActivityInput
): Promise<ActionResult> {
  const parsed = cancelActivitySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { error } = await ctx.supabase
    .from("cleaning_activities")
    .update({ status: "cancelled" })
    .eq("id", parsed.data.activityId)
    .in("status", ["draft", "active"])

  if (error) return { success: false, error: "Failed to cancel activity" }
  return { success: true }
}

export async function closeActivity(
  input: CloseActivityInput
): Promise<ActionResult> {
  const parsed = closeActivitySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { error } = await ctx.supabase
    .from("cleaning_activities")
    .update({ status: "closed" })
    .eq("id", parsed.data.activityId)
    .eq("status", "active")

  if (error) return { success: false, error: "Failed to close activity" }
  return { success: true }
}

export async function updateRoomTaskStatus(
  input: UpdateRoomTaskStatusInput
): Promise<ActionResult> {
  const parsed = updateRoomTaskStatusSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAuthContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const updateData: Record<string, unknown> = {
    status: parsed.data.status,
  }

  if (parsed.data.status === "in_progress") {
    updateData.started_at = new Date().toISOString()
  } else if (parsed.data.status === "done") {
    updateData.completed_at = new Date().toISOString()
  }

  const { error } = await ctx.supabase
    .from("room_tasks")
    .update(updateData)
    .eq("id", parsed.data.taskId)

  if (error) return { success: false, error: "Failed to update task status" }
  return { success: true }
}

export async function inspectRoomTask(
  input: InspectRoomTaskInput
): Promise<ActionResult> {
  const parsed = inspectRoomTaskSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Verify task exists and is in "done" status (ready for inspection)
  const { data: task } = await ctx.supabase
    .from("room_tasks")
    .select("id, status")
    .eq("id", parsed.data.taskId)
    .single()

  if (!task) return { success: false, error: "Task not found" }
  if (task.status !== "done") {
    return { success: false, error: "Only completed tasks can be inspected" }
  }

  const { error } = await ctx.supabase
    .from("room_tasks")
    .update({
      status: parsed.data.result,
      inspected_by: ctx.user.id,
      inspected_at: new Date().toISOString(),
      inspection_note: parsed.data.note ?? null,
    })
    .eq("id", parsed.data.taskId)

  if (error) return { success: false, error: "Failed to inspect task" }
  return { success: true }
}
