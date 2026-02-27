import { z } from "zod"

export const upsertItemResponseSchema = z.object({
  roomTaskId: z.string().uuid(),
  checklistItemId: z.string().uuid(),
  isCompleted: z.boolean(),
  note: z.string().max(500).nullable().optional(),
})

export const completeRoomTaskSchema = z.object({
  roomTaskId: z.string().uuid(),
  status: z.enum(["done", "has_issues"]),
  issueNote: z.string().max(500).optional(),
})

export type UpsertItemResponseInput = z.infer<typeof upsertItemResponseSchema>
export type CompleteRoomTaskInput = z.infer<typeof completeRoomTaskSchema>
