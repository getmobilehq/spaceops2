import { z } from "zod"

export const clockInSchema = z.object({
  buildingId: z.string().uuid("Invalid building ID"),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  geoError: z.string().nullable().optional(),
})

export type ClockInInput = z.infer<typeof clockInSchema>

export const clockOutSchema = z.object({
  attendanceId: z.string().uuid("Invalid attendance ID"),
})

export type ClockOutInput = z.infer<typeof clockOutSchema>

export const updateBuildingLocationSchema = z.object({
  buildingId: z.string().uuid("Invalid building ID"),
  latitude: z.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
  longitude: z.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180"),
  geofenceRadiusM: z.number().int().min(10, "Radius must be at least 10m").max(5000, "Radius must be at most 5000m").default(150),
})

export type UpdateBuildingLocationInput = z.infer<typeof updateBuildingLocationSchema>
