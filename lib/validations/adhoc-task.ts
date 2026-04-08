import { z } from "zod"

export const createAdhocTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  dueTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time")
    .optional()
    .or(z.literal("")),
  assignedTo: z.string().uuid("Invalid user"),
})

export type CreateAdhocTaskInput = z.infer<typeof createAdhocTaskSchema>

export const completeAdhocTaskSchema = z.object({
  taskId: z.string().uuid(),
})

export type CompleteAdhocTaskInput = z.infer<typeof completeAdhocTaskSchema>

export const deleteAdhocTaskSchema = z.object({
  taskId: z.string().uuid(),
})

export type DeleteAdhocTaskInput = z.infer<typeof deleteAdhocTaskSchema>
