"use server"

import { createClient } from "@/lib/supabase/server"
import {
  createTemplateSchema,
  updateTemplateSchema,
  deleteTemplateSchema,
  upsertItemSchema,
  deleteItemSchema,
  reorderItemsSchema,
  setDefaultSchema,
  setOverrideSchema,
  type CreateTemplateInput,
  type UpdateTemplateInput,
  type DeleteTemplateInput,
  type UpsertItemInput,
  type DeleteItemInput,
  type ReorderItemsInput,
  type SetDefaultInput,
  type SetOverrideInput,
} from "@/lib/validations/checklist"

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

export async function createTemplate(
  input: CreateTemplateInput
): Promise<ActionResultWithId> {
  const parsed = createTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { data, error } = await ctx.supabase
    .from("checklist_templates")
    .insert({
      org_id: ctx.orgId,
      room_type_id: parsed.data.roomTypeId ?? null,
      name: parsed.data.name,
    })
    .select("id")
    .single()

  if (error) return { success: false, error: "Failed to create template" }
  return { success: true, id: data.id }
}

export async function updateTemplate(
  input: UpdateTemplateInput
): Promise<ActionResult> {
  const parsed = updateTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const updateData: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name
  if (parsed.data.roomTypeId !== undefined)
    updateData.room_type_id = parsed.data.roomTypeId

  const { error } = await ctx.supabase
    .from("checklist_templates")
    .update(updateData)
    .eq("id", parsed.data.templateId)

  if (error) return { success: false, error: "Failed to update template" }
  return { success: true }
}

export async function deleteTemplate(
  input: DeleteTemplateInput
): Promise<ActionResult> {
  const parsed = deleteTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { error } = await ctx.supabase
    .from("checklist_templates")
    .delete()
    .eq("id", parsed.data.templateId)

  if (error) return { success: false, error: "Failed to delete template" }
  return { success: true }
}

export async function upsertItem(
  input: UpsertItemInput
): Promise<ActionResultWithId> {
  const parsed = upsertItemSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  if (parsed.data.itemId) {
    // Update existing item
    const { error } = await ctx.supabase
      .from("checklist_items")
      .update({
        description: parsed.data.description,
        requires_photo: parsed.data.requiresPhoto,
        requires_note: parsed.data.requiresNote,
      })
      .eq("id", parsed.data.itemId)

    if (error) return { success: false, error: "Failed to update item" }
    return { success: true, id: parsed.data.itemId }
  } else {
    // Create new item — get max order
    const { data: existing } = await ctx.supabase
      .from("checklist_items")
      .select("item_order")
      .eq("template_id", parsed.data.templateId)
      .order("item_order", { ascending: false })
      .limit(1)

    const nextOrder = existing && existing.length > 0 ? existing[0].item_order + 1 : 1

    const { data, error } = await ctx.supabase
      .from("checklist_items")
      .insert({
        template_id: parsed.data.templateId,
        org_id: ctx.orgId,
        description: parsed.data.description,
        item_order: nextOrder,
        requires_photo: parsed.data.requiresPhoto,
        requires_note: parsed.data.requiresNote,
      })
      .select("id")
      .single()

    if (error) return { success: false, error: "Failed to create item" }
    return { success: true, id: data.id }
  }
}

export async function deleteItem(
  input: DeleteItemInput
): Promise<ActionResult> {
  const parsed = deleteItemSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { error } = await ctx.supabase
    .from("checklist_items")
    .delete()
    .eq("id", parsed.data.itemId)

  if (error) return { success: false, error: "Failed to delete item" }
  return { success: true }
}

export async function reorderItems(
  input: ReorderItemsInput
): Promise<ActionResult> {
  const parsed = reorderItemsSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Batch update each item's order
  const updates = parsed.data.itemIds.map((id, index) =>
    ctx.supabase
      .from("checklist_items")
      .update({ item_order: index + 1 })
      .eq("id", id)
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) return { success: false, error: "Failed to reorder items" }

  return { success: true }
}

export async function setDefault(
  input: SetDefaultInput
): Promise<ActionResult> {
  const parsed = setDefaultSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Unset any existing default for this room type
  await ctx.supabase
    .from("checklist_templates")
    .update({ is_default: false })
    .eq("room_type_id", parsed.data.roomTypeId)
    .eq("is_default", true)

  // Set this template as default
  const { error } = await ctx.supabase
    .from("checklist_templates")
    .update({ is_default: true, room_type_id: parsed.data.roomTypeId })
    .eq("id", parsed.data.templateId)

  if (error) return { success: false, error: "Failed to set default" }
  return { success: true }
}

export async function setOverride(
  input: SetOverrideInput
): Promise<ActionResult> {
  const parsed = setOverrideSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  if (parsed.data.templateId === null) {
    // Remove override
    await ctx.supabase
      .from("room_checklist_overrides")
      .delete()
      .eq("room_id", parsed.data.roomId)

    return { success: true }
  }

  // Upsert override
  const { error } = await ctx.supabase
    .from("room_checklist_overrides")
    .upsert(
      {
        room_id: parsed.data.roomId,
        template_id: parsed.data.templateId,
        org_id: ctx.orgId,
      },
      { onConflict: "room_id" }
    )

  if (error) return { success: false, error: "Failed to set override" }
  return { success: true }
}
