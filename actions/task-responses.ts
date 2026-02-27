"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  upsertItemResponseSchema,
  completeRoomTaskSchema,
  type UpsertItemResponseInput,
  type CompleteRoomTaskInput,
} from "@/lib/validations/task-response"

type ActionResult = { success: true } | { success: false; error: string }
type ActionResultWithData<T> =
  | { success: true; data: T }
  | { success: false; error: string }

async function getJanitorContext() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const role = user.app_metadata?.role as string | undefined
  const orgId = user.app_metadata?.org_id as string | undefined

  if (role !== "janitor" || !orgId) return null

  return { user, orgId, supabase }
}

export async function upsertItemResponse(
  input: UpsertItemResponseInput
): Promise<ActionResult> {
  const parsed = upsertItemResponseSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getJanitorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Verify task is assigned to this janitor and in a workable state
  const { data: task } = await ctx.supabase
    .from("room_tasks")
    .select("id, assigned_to, status")
    .eq("id", parsed.data.roomTaskId)
    .single()

  if (!task || task.assigned_to !== ctx.user.id) {
    return { success: false, error: "Task not assigned to you" }
  }

  if (task.status !== "in_progress" && task.status !== "not_started") {
    return { success: false, error: "Task is not in a workable state" }
  }

  // Auto-start task on first interaction
  if (task.status === "not_started") {
    await ctx.supabase
      .from("room_tasks")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", parsed.data.roomTaskId)
  }

  const { error } = await ctx.supabase
    .from("task_item_responses")
    .upsert(
      {
        room_task_id: parsed.data.roomTaskId,
        checklist_item_id: parsed.data.checklistItemId,
        org_id: ctx.orgId,
        is_completed: parsed.data.isCompleted,
        note: parsed.data.note ?? null,
        completed_at: parsed.data.isCompleted
          ? new Date().toISOString()
          : null,
      },
      { onConflict: "room_task_id,checklist_item_id" }
    )

  if (error) return { success: false, error: "Failed to save response" }
  return { success: true }
}

export async function uploadItemPhoto(
  formData: FormData
): Promise<ActionResultWithData<{ photoUrl: string }>> {
  const roomTaskId = formData.get("roomTaskId") as string | null
  const checklistItemId = formData.get("checklistItemId") as string | null
  const file = formData.get("photo") as File | null

  if (!roomTaskId || !checklistItemId || !file || file.size === 0) {
    return { success: false, error: "Missing required fields" }
  }

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Invalid file type. Upload JPEG, PNG, or WebP." }
  }
  if (file.size > MAX_SIZE) {
    return { success: false, error: "Photo must be smaller than 5MB." }
  }

  const ctx = await getJanitorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Verify task ownership
  const { data: task } = await ctx.supabase
    .from("room_tasks")
    .select("assigned_to, status")
    .eq("id", roomTaskId)
    .single()

  if (!task || task.assigned_to !== ctx.user.id) {
    return { success: false, error: "Task not assigned to you" }
  }

  const ext = file.name.split(".").pop() || "jpg"
  const filePath = `${ctx.orgId}/${roomTaskId}/${checklistItemId}.${ext}`

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from("cleaning-photos")
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    return { success: false, error: "Failed to upload photo" }
  }

  // Upsert the response with photo_url
  await ctx.supabase
    .from("task_item_responses")
    .upsert(
      {
        room_task_id: roomTaskId,
        checklist_item_id: checklistItemId,
        org_id: ctx.orgId,
        photo_url: filePath,
      },
      { onConflict: "room_task_id,checklist_item_id" }
    )

  return { success: true, data: { photoUrl: filePath } }
}

export async function completeRoomTask(
  input: CompleteRoomTaskInput
): Promise<ActionResult> {
  const parsed = completeRoomTaskSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getJanitorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Verify task ownership and status
  const { data: task } = await ctx.supabase
    .from("room_tasks")
    .select("id, room_id, assigned_to, status")
    .eq("id", parsed.data.roomTaskId)
    .single()

  if (!task || task.assigned_to !== ctx.user.id) {
    return { success: false, error: "Task not assigned to you" }
  }

  if (task.status !== "in_progress") {
    return { success: false, error: "Task must be in progress to complete" }
  }

  // If marking as "done", validate all required checklist items are satisfied
  if (parsed.data.status === "done") {
    // Resolve effective checklist
    const { data: override } = await ctx.supabase
      .from("room_checklist_overrides")
      .select("template_id")
      .eq("room_id", task.room_id)
      .maybeSingle()

    let templateId = override?.template_id ?? null

    if (!templateId) {
      const { data: room } = await ctx.supabase
        .from("rooms")
        .select("room_type_id")
        .eq("id", task.room_id)
        .single()

      if (room?.room_type_id) {
        const { data: defaultTpl } = await ctx.supabase
          .from("checklist_templates")
          .select("id")
          .eq("room_type_id", room.room_type_id)
          .eq("is_default", true)
          .maybeSingle()

        templateId = defaultTpl?.id ?? null
      }
    }

    if (templateId) {
      const { data: requiredItems } = await ctx.supabase
        .from("checklist_items")
        .select("id, requires_photo, requires_note")
        .eq("template_id", templateId)

      const { data: responses } = await ctx.supabase
        .from("task_item_responses")
        .select("checklist_item_id, is_completed, photo_url, note")
        .eq("room_task_id", parsed.data.roomTaskId)

      const responseMap = new Map(
        (responses || []).map((r) => [r.checklist_item_id, r])
      )

      for (const item of requiredItems || []) {
        const resp = responseMap.get(item.id)
        if (!resp || !resp.is_completed) {
          return {
            success: false,
            error: "All checklist items must be completed before marking done",
          }
        }
        if (item.requires_photo && !resp.photo_url) {
          return {
            success: false,
            error: "Some items require a photo. Please add all required photos.",
          }
        }
        if (item.requires_note && !resp.note) {
          return {
            success: false,
            error: "Some items require a note. Please add all required notes.",
          }
        }
      }
    }
  }

  const { error } = await ctx.supabase
    .from("room_tasks")
    .update({
      status: parsed.data.status,
      completed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.roomTaskId)

  if (error) return { success: false, error: "Failed to complete task" }
  return { success: true }
}
