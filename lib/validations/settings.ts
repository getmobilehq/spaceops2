import { z } from "zod"

export const updateOrgSettingsSchema = z.object({
  name: z
    .string()
    .min(1, "Organisation name is required")
    .max(100, "Organisation name must be 100 characters or fewer"),
  passThreshold: z
    .number()
    .int("Threshold must be a whole number")
    .min(0, "Threshold must be at least 0")
    .max(100, "Threshold must be at most 100"),
})

export type UpdateOrgSettingsInput = z.infer<typeof updateOrgSettingsSchema>
