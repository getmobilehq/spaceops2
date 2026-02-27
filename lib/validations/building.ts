import { z } from "zod"

const buildingStatusEnum = z.enum(["active", "inactive", "setup"])

export const buildingDetailsSchema = z.object({
  name: z
    .string()
    .min(1, "Building name is required")
    .max(100, "Building name must be 100 characters or fewer"),
  address: z
    .string()
    .min(1, "Address is required")
    .max(200, "Address must be 200 characters or fewer"),
})

export type BuildingDetailsInput = z.infer<typeof buildingDetailsSchema>

export const buildingClientSchema = z.object({
  clientId: z.string().uuid("Invalid client").nullable(),
})

export type BuildingClientInput = z.infer<typeof buildingClientSchema>

export const floorEntrySchema = z.object({
  floorNumber: z.number().int("Floor number must be an integer"),
  floorName: z
    .string()
    .min(1, "Floor name is required")
    .max(50, "Floor name must be 50 characters or fewer"),
})

export const buildingFloorsSchema = z.object({
  floors: z.array(floorEntrySchema).min(1, "At least one floor is required"),
})

export type FloorEntryInput = z.infer<typeof floorEntrySchema>
export type BuildingFloorsInput = z.infer<typeof buildingFloorsSchema>

export const createBuildingSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().min(1).max(200),
  clientId: z.string().uuid().nullable(),
  floors: z.array(floorEntrySchema).min(1),
})

export type CreateBuildingInput = z.infer<typeof createBuildingSchema>

export const updateBuildingSchema = z.object({
  buildingId: z.string().uuid("Invalid building ID"),
  name: z.string().min(1).max(100).optional(),
  address: z.string().min(1).max(200).optional(),
  clientId: z.string().uuid().nullable().optional(),
  status: buildingStatusEnum.optional(),
})

export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>

export const assignSupervisorSchema = z.object({
  buildingId: z.string().uuid("Invalid building ID"),
  userId: z.string().uuid("Invalid user ID"),
})

export type AssignSupervisorInput = z.infer<typeof assignSupervisorSchema>

export const removeSupervisorSchema = z.object({
  buildingId: z.string().uuid("Invalid building ID"),
  userId: z.string().uuid("Invalid user ID"),
})

export type RemoveSupervisorInput = z.infer<typeof removeSupervisorSchema>

export const BUILDING_STATUS_OPTIONS = [
  { value: "setup", label: "Setup" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const
