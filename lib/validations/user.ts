import { z } from "zod"

const roleEnum = z.enum(["admin", "supervisor", "janitor", "client"])

export const inviteUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or fewer"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be 50 characters or fewer"),
  role: roleEnum,
})

export type InviteUserInput = z.infer<typeof inviteUserSchema>

export const updateUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or fewer"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be 50 characters or fewer"),
  role: roleEnum,
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const toggleUserActiveSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
})

export type ToggleUserActiveInput = z.infer<typeof toggleUserActiveSchema>

export const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "supervisor", label: "Supervisor" },
  { value: "janitor", label: "Janitor" },
  { value: "client", label: "Client" },
] as const
