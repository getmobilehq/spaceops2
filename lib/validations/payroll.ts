import { z } from "zod"

export const upsertPayrollSettingsSchema = z.object({
  userId: z.string().uuid(),
  hourlyRate: z.number().positive("Hourly rate must be positive").max(9999),
  overtimeThresholdHours: z
    .number()
    .min(0, "Threshold cannot be negative")
    .max(168, "Threshold cannot exceed 168 hours"),
  overtimeMultiplier: z
    .number()
    .min(1, "Multiplier must be at least 1")
    .max(5, "Multiplier cannot exceed 5"),
})

export type UpsertPayrollSettingsInput = z.infer<typeof upsertPayrollSettingsSchema>

export const generatePayrollRunSchema = z
  .object({
    periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    notes: z.string().max(500).optional(),
  })
  .refine((d) => d.periodEnd >= d.periodStart, {
    message: "End date must be on or after start date",
    path: ["periodEnd"],
  })

export type GeneratePayrollRunInput = z.infer<typeof generatePayrollRunSchema>

export const approvePayrollRunSchema = z.object({
  runId: z.string().uuid(),
})

export type ApprovePayrollRunInput = z.infer<typeof approvePayrollRunSchema>

export const deletePayrollRunSchema = z.object({
  runId: z.string().uuid(),
})

export type DeletePayrollRunInput = z.infer<typeof deletePayrollRunSchema>
