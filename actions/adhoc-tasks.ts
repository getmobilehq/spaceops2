"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  createAdhocTaskSchema,
  completeAdhocTaskSchema,
  deleteAdhocTaskSchema,
  type CreateAdhocTaskInput,
  type CompleteAdhocTaskInput,
  type DeleteAdhocTaskInput,
} from "@/lib/validations/adhoc-task"

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

export async function createAdhocTask(
  input: CreateAdhocTaskInput
): Promise<ActionResultWithId> {
  const parsed = createAdhocTaskSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { data, error } = await ctx.supabase
    .from("adhoc_tasks")
    .insert({
      org_id: ctx.orgId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      due_date: parsed.data.dueDate,
      due_time: parsed.data.dueTime || null,
      assigned_to: parsed.data.assignedTo,
      created_by: ctx.user.id,
    })
    .select("id")
    .single()

  if (error || !data) {
    return { success: false, error: "Failed to create task" }
  }

  return { success: true, id: data.id }
}

export async function uploadAdhocTaskImage(
  taskId: string,
  formData: FormData
): Promise<ActionResult & { imageUrl?: string }> {
  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const file = formData.get("file") as File | null
  if (!file) return { success: false, error: "No file provided" }

  const ext = file.name.split(".").pop() || "jpg"
  const path = `${ctx.orgId}/${taskId}.${ext}`

  // Convert File to Buffer for server-side upload
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from("adhoc-task-images")
    .upload(path, buffer, {
      upsert: true,
      contentType: file.type || "image/jpeg",
    })

  if (uploadError) {
    return { success: false, error: "Failed to upload image" }
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("adhoc-task-images").getPublicUrl(path)

  // Update the task record with the image URL
  await ctx.supabase
    .from("adhoc_tasks")
    .update({ image_url: publicUrl })
    .eq("id", taskId)

  return { success: true, imageUrl: publicUrl }
}

export async function completeAdhocTask(
  input: CompleteAdhocTaskInput
): Promise<ActionResult> {
  const parsed = completeAdhocTaskSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "Unauthorized" }

  const { error } = await supabase
    .from("adhoc_tasks")
    .update({
      status: "done",
      completed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.taskId)
    .eq("assigned_to", user.id)

  if (error) return { success: false, error: "Failed to complete task" }
  return { success: true }
}

export async function deleteAdhocTask(
  input: DeleteAdhocTaskInput
): Promise<ActionResult> {
  const parsed = deleteAdhocTaskSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { error } = await ctx.supabase
    .from("adhoc_tasks")
    .delete()
    .eq("id", parsed.data.taskId)

  if (error) return { success: false, error: "Failed to delete task" }
  return { success: true }
}
