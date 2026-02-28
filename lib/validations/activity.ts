import { z } from "zod"

export const createActivitySchema = z.object({
  floorId: z.string().uuid(),
  name: z.string().min(1, "Activity name is required").max(100),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  windowStart: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  windowEnd: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  notes: z.string().max(500).optional(),
})

export const updateActivitySchema = z.object({
  activityId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  windowStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  windowEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notes: z.string().max(500).nullable().optional(),
})

export const assignRoomTasksSchema = z.object({
  activityId: z.string().uuid(),
  assignments: z.array(
    z.object({
      roomId: z.string().uuid(),
      assignedTo: z.string().uuid().nullable(),
    })
  ),
})

export const publishActivitySchema = z.object({
  activityId: z.string().uuid(),
})

export const cancelActivitySchema = z.object({
  activityId: z.string().uuid(),
})

export const closeActivitySchema = z.object({
  activityId: z.string().uuid(),
})

export const updateRoomTaskStatusSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["not_started", "in_progress", "done", "has_issues"]),
})

export const inspectRoomTaskSchema = z.object({
  taskId: z.string().uuid(),
  result: z.enum(["inspected_pass", "inspected_fail"]),
  note: z.string().max(500).optional(),
})

export type CreateActivityInput = z.infer<typeof createActivitySchema>
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>
export type AssignRoomTasksInput = z.infer<typeof assignRoomTasksSchema>
export type PublishActivityInput = z.infer<typeof publishActivitySchema>
export type CancelActivityInput = z.infer<typeof cancelActivitySchema>
export type CloseActivityInput = z.infer<typeof closeActivitySchema>
export type UpdateRoomTaskStatusInput = z.infer<typeof updateRoomTaskStatusSchema>
export type InspectRoomTaskInput = z.infer<typeof inspectRoomTaskSchema>
