import { z } from "zod"

export const registerSchema = z.object({
  orgName: z
    .string()
    .min(2, "Organisation name must be at least 2 characters")
    .max(100, "Organisation name must be 100 characters or fewer"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or fewer"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be 50 characters or fewer"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
})

export type RegisterInput = z.infer<typeof registerSchema>
