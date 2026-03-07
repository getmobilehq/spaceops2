import { z } from "zod"

export const createInspectionSchema = z.object({
  roomId: z.string().uuid("Invalid room ID"),
  buildingId: z.string().uuid("Invalid building ID"),
  floorId: z.string().uuid("Invalid floor ID"),
})

export type CreateInspectionInput = z.infer<typeof createInspectionSchema>

export const completeInspectionSchema = z.object({
  inspectionId: z.string().uuid("Invalid inspection ID"),
  result: z.enum(["passed", "failed"]),
  notes: z.string().max(500).optional(),
})

export type CompleteInspectionInput = z.infer<typeof completeInspectionSchema>

export const scanInspectionRoomSchema = z.object({
  inspectionId: z.string().uuid("Invalid inspection ID"),
  roomId: z.string().uuid("Invalid room ID"),
})

export type ScanInspectionRoomInput = z.infer<typeof scanInspectionRoomSchema>
