import { z } from "zod"

export const createDeficiencySchema = z.object({
  roomTaskId: z.string().uuid(),
  description: z.string().min(1, "Description is required").max(500),
  severity: z.enum(["low", "medium", "high"]),
  assignedTo: z.string().uuid().nullable().optional(),
})

export const resolveDeficiencySchema = z.object({
  deficiencyId: z.string().uuid(),
  resolutionNote: z.string().max(500).optional(),
})

export type CreateDeficiencyInput = z.infer<typeof createDeficiencySchema>
export type ResolveDeficiencyInput = z.infer<typeof resolveDeficiencySchema>
