import { z } from "zod"

export const createRoomSchema = z.object({
  floorId: z.string().uuid(),
  name: z.string().min(1, "Room name is required").max(100),
  roomTypeId: z.string().uuid("Please select a room type"),
})

export type CreateRoomInput = z.infer<typeof createRoomSchema>

export const updateRoomSchema = z.object({
  roomId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  roomTypeId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
})

export type UpdateRoomInput = z.infer<typeof updateRoomSchema>

export const deleteRoomSchema = z.object({
  roomId: z.string().uuid(),
})

export type DeleteRoomInput = z.infer<typeof deleteRoomSchema>

export const createRoomTypeSchema = z.object({
  name: z.string().min(1, "Type name is required").max(50),
})

export type CreateRoomTypeInput = z.infer<typeof createRoomTypeSchema>
