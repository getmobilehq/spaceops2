"use server"

import { createClient } from "@/lib/supabase/server"
import {
  createDeficiencySchema,
  resolveDeficiencySchema,
  updateDeficiencySchema,
  reportIssueSchema,
  type CreateDeficiencyInput,
  type ResolveDeficiencyInput,
  type UpdateDeficiencyInput,
  type ReportIssueInput,
} from "@/lib/validations/deficiency"
import { createNotification } from "@/actions/notifications"

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

export async function createDeficiency(
  input: CreateDeficiencyInput
): Promise<ActionResultWithId> {
  const parsed = createDeficiencySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Verify the room task exists and belongs to same org
  const { data: task } = await ctx.supabase
    .from("room_tasks")
    .select("id, status")
    .eq("id", parsed.data.roomTaskId)
    .single()

  if (!task) return { success: false, error: "Task not found" }

  const { data: deficiency, error } = await ctx.supabase
    .from("deficiencies")
    .insert({
      room_task_id: parsed.data.roomTaskId,
      org_id: ctx.orgId,
      reported_by: ctx.user.id,
      assigned_to: parsed.data.assignedTo ?? null,
      description: parsed.data.description,
      severity: parsed.data.severity,
    })
    .select("id")
    .single()

  if (error) return { success: false, error: "Failed to create deficiency" }

  // Notify assigned janitor
  if (parsed.data.assignedTo) {
    await createNotification(ctx.supabase, {
      orgId: ctx.orgId,
      userId: parsed.data.assignedTo,
      type: "deficiency_assigned",
      title: "Deficiency assigned to you",
      body: parsed.data.description.length > 80
        ? parsed.data.description.slice(0, 80) + "..."
        : parsed.data.description,
    })
  }

  return { success: true, id: deficiency.id }
}

export async function resolveDeficiency(
  input: ResolveDeficiencyInput
): Promise<ActionResult> {
  const parsed = resolveDeficiencySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAuthContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Verify deficiency exists and is open or in_progress
  const { data: deficiency } = await ctx.supabase
    .from("deficiencies")
    .select("id, status, reported_by, description")
    .eq("id", parsed.data.deficiencyId)
    .single()

  if (!deficiency) return { success: false, error: "Deficiency not found" }
  if (deficiency.status === "resolved") {
    return { success: false, error: "Deficiency already resolved" }
  }

  const { error } = await ctx.supabase
    .from("deficiencies")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      resolved_by: ctx.user.id,
      resolution_note: parsed.data.resolutionNote ?? null,
    })
    .eq("id", parsed.data.deficiencyId)

  if (error) return { success: false, error: "Failed to resolve deficiency" }

  // Notify the supervisor who reported the deficiency
  if (deficiency.reported_by && deficiency.reported_by !== ctx.user.id) {
    const desc = deficiency.description.length > 80
      ? deficiency.description.slice(0, 80) + "..."
      : deficiency.description
    await createNotification(ctx.supabase, {
      orgId: ctx.orgId,
      userId: deficiency.reported_by,
      type: "deficiency_resolved",
      title: "Deficiency resolved",
      body: desc,
    })
  }

  return { success: true }
}

export async function updateDeficiency(
  input: UpdateDeficiencyInput
): Promise<ActionResult> {
  const parsed = updateDeficiencySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { data: existing } = await ctx.supabase
    .from("deficiencies")
    .select("id, status, assigned_to, description")
    .eq("id", parsed.data.deficiencyId)
    .single()

  if (!existing) return { success: false, error: "Deficiency not found" }

  const updateData: Record<string, unknown> = {}

  if (parsed.data.status !== undefined) {
    updateData.status = parsed.data.status
    if (parsed.data.status === "resolved") {
      updateData.resolved_at = new Date().toISOString()
      updateData.resolved_by = ctx.user.id
    }
  }
  if (parsed.data.assignedTo !== undefined) {
    updateData.assigned_to = parsed.data.assignedTo
  }
  if (parsed.data.severity !== undefined) {
    updateData.severity = parsed.data.severity
  }
  if (parsed.data.note !== undefined) {
    updateData.resolution_note = parsed.data.note
  }

  const { error } = await ctx.supabase
    .from("deficiencies")
    .update(updateData)
    .eq("id", parsed.data.deficiencyId)

  if (error) return { success: false, error: "Failed to update deficiency" }

  // Notify if reassigned to a different janitor
  if (
    parsed.data.assignedTo &&
    parsed.data.assignedTo !== existing.assigned_to
  ) {
    const desc = existing.description.length > 80
      ? existing.description.slice(0, 80) + "..."
      : existing.description
    await createNotification(ctx.supabase, {
      orgId: ctx.orgId,
      userId: parsed.data.assignedTo,
      type: "deficiency_assigned",
      title: "Deficiency assigned to you",
      body: desc,
    })
  }

  return { success: true }
}

export async function reportIssue(
  input: ReportIssueInput
): Promise<ActionResultWithId> {
  const parsed = reportIssueSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAuthContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Verify room exists and belongs to user's org
  const { data: room } = await ctx.supabase
    .from("rooms")
    .select("id, name, floor_id")
    .eq("id", parsed.data.roomId)
    .single()

  if (!room) return { success: false, error: "Room not found" }

  // Find the most recent active room_task for this room (if any)
  const { data: recentTask } = await ctx.supabase
    .from("room_tasks")
    .select("id, cleaning_activities!inner(status)")
    .eq("room_id", parsed.data.roomId)
    .eq("cleaning_activities.status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const roomTaskId = recentTask?.id ?? null

  // If no active task, we still allow creating the deficiency
  // but we need a room_task_id since the FK is NOT NULL
  if (!roomTaskId) {
    return {
      success: false,
      error: "No active cleaning task for this room. Ask a supervisor to report this issue.",
    }
  }

  const { data: deficiency, error } = await ctx.supabase
    .from("deficiencies")
    .insert({
      room_task_id: roomTaskId,
      org_id: ctx.orgId,
      reported_by: ctx.user.id,
      description: parsed.data.description,
      severity: parsed.data.severity,
    })
    .select("id")
    .single()

  if (error) return { success: false, error: "Failed to report issue" }

  return { success: true, id: deficiency.id }
}
