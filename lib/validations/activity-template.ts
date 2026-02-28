import { z } from "zod"

export const createActivityTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
  floorId: z.string().uuid(),
  windowStart: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  windowEnd: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  notes: z.string().max(500).optional(),
  defaultAssignments: z
    .array(
      z.object({
        room_id: z.string().uuid(),
        assigned_to: z.string().uuid(),
      })
    )
    .default([]),
})

export const updateActivityTemplateSchema = z.object({
  templateId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  windowStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  windowEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notes: z.string().max(500).nullable().optional(),
  defaultAssignments: z
    .array(
      z.object({
        room_id: z.string().uuid(),
        assigned_to: z.string().uuid(),
      })
    )
    .optional(),
})

export const deleteActivityTemplateSchema = z.object({
  templateId: z.string().uuid(),
})

export const saveActivityAsTemplateSchema = z.object({
  activityId: z.string().uuid(),
  name: z.string().min(1, "Template name is required").max(100),
})

export type CreateActivityTemplateInput = z.infer<typeof createActivityTemplateSchema>
export type UpdateActivityTemplateInput = z.infer<typeof updateActivityTemplateSchema>
export type DeleteActivityTemplateInput = z.infer<typeof deleteActivityTemplateSchema>
export type SaveActivityAsTemplateInput = z.infer<typeof saveActivityAsTemplateSchema>
