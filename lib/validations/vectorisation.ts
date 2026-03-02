import { z } from "zod"

/**
 * A single room/space extracted by Claude Vision from a floor plan image.
 * Positions and dimensions are percentages (0-100) of the image dimensions.
 */
export const extractedRoomSchema = z.object({
  tempId: z.string(),
  label: z.string(),
  detectedType: z.string(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(0).max(100),
  height: z.number().min(0).max(100),
  confidence: z.enum(["high", "medium", "low"]),
})

export type ExtractedRoom = z.infer<typeof extractedRoomSchema>

/**
 * Complete extraction result stored in vectorised_plans.extracted_data
 */
export const extractionResultSchema = z.object({
  version: z.literal(1),
  rooms: z.array(extractedRoomSchema),
  totalDetected: z.number(),
  layoutSummary: z.string(),
  model: z.string(),
})

export type ExtractionResult = z.infer<typeof extractionResultSchema>

/**
 * A room after admin review: includes match/create/skip decisions
 */
export const reviewedRoomSchema = extractedRoomSchema.extend({
  action: z.enum(["match", "create", "skip"]),
  matchedRoomId: z.string().uuid().optional(),
  overrideName: z.string().optional(),
  roomTypeId: z.string().uuid().optional(),
})

export type ReviewedRoom = z.infer<typeof reviewedRoomSchema>

// Server action input schemas

export const vectoriseFloorPlanSchema = z.object({
  floorId: z.string().uuid(),
})

export type VectoriseFloorPlanInput = z.infer<typeof vectoriseFloorPlanSchema>

export const applyVectorisationSchema = z.object({
  floorId: z.string().uuid(),
  rooms: z.array(reviewedRoomSchema),
})

export type ApplyVectorisationInput = z.infer<typeof applyVectorisationSchema>
