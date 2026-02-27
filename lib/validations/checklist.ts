import { z } from "zod"

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
  roomTypeId: z.string().uuid().nullable().optional(),
})

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>

export const updateTemplateSchema = z.object({
  templateId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  roomTypeId: z.string().uuid().nullable().optional(),
})

export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>

export const deleteTemplateSchema = z.object({
  templateId: z.string().uuid(),
})

export type DeleteTemplateInput = z.infer<typeof deleteTemplateSchema>

export const upsertItemSchema = z.object({
  templateId: z.string().uuid(),
  itemId: z.string().uuid().optional(),
  description: z.string().min(1, "Item description is required").max(200),
  requiresPhoto: z.boolean().default(false),
  requiresNote: z.boolean().default(false),
})

export type UpsertItemInput = z.infer<typeof upsertItemSchema>

export const deleteItemSchema = z.object({
  itemId: z.string().uuid(),
})

export type DeleteItemInput = z.infer<typeof deleteItemSchema>

export const reorderItemsSchema = z.object({
  templateId: z.string().uuid(),
  itemIds: z.array(z.string().uuid()).min(1),
})

export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>

export const setDefaultSchema = z.object({
  templateId: z.string().uuid(),
  roomTypeId: z.string().uuid(),
})

export type SetDefaultInput = z.infer<typeof setDefaultSchema>

export const setOverrideSchema = z.object({
  roomId: z.string().uuid(),
  templateId: z.string().uuid().nullable(),
})

export type SetOverrideInput = z.infer<typeof setOverrideSchema>
