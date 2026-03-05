import { z } from "zod"

export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

const timeSlotSchema = z.object({
  window_start: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  window_end: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  label: z.string().max(50).optional(),
})

export type TimeSlot = z.infer<typeof timeSlotSchema>

const recurrencePresetSchema = z.enum([
  "once_daily",
  "twice_daily",
  "three_daily",
  "custom",
])

export type RecurrencePreset = z.infer<typeof recurrencePresetSchema>

export const createActivityTemplateSchema = z
  .object({
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
    isRecurring: z.boolean().default(false),
    recurrenceDays: z.array(z.enum(DAYS_OF_WEEK)).default([]),
    timeSlots: z.array(timeSlotSchema).default([]),
    recurrencePreset: recurrencePresetSchema.nullable().default(null),
  })
  .refine(
    (data) => {
      if (data.isRecurring) {
        return data.recurrenceDays.length > 0 && data.timeSlots.length > 0
      }
      return true
    },
    { message: "Recurring templates need at least one day and one time slot" }
  )

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
  isRecurring: z.boolean().optional(),
  recurrenceDays: z.array(z.enum(DAYS_OF_WEEK)).optional(),
  timeSlots: z.array(timeSlotSchema).optional(),
  recurrencePreset: recurrencePresetSchema.nullable().optional(),
})

export const deleteActivityTemplateSchema = z.object({
  templateId: z.string().uuid(),
})

export const saveActivityAsTemplateSchema = z.object({
  activityId: z.string().uuid(),
  name: z.string().min(1, "Template name is required").max(100),
})

export const toggleRecurringSchema = z.object({
  templateId: z.string().uuid(),
  isActive: z.boolean(),
})

export const generateActivitiesSchema = z.object({
  templateId: z.string().uuid().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

export type CreateActivityTemplateInput = z.infer<typeof createActivityTemplateSchema>
export type UpdateActivityTemplateInput = z.infer<typeof updateActivityTemplateSchema>
export type DeleteActivityTemplateInput = z.infer<typeof deleteActivityTemplateSchema>
export type SaveActivityAsTemplateInput = z.infer<typeof saveActivityAsTemplateSchema>
export type ToggleRecurringInput = z.infer<typeof toggleRecurringSchema>
export type GenerateActivitiesInput = z.infer<typeof generateActivitiesSchema>
