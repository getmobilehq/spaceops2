import { z } from "zod"

export const createClientSchema = z.object({
  companyName: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Company name must be 100 characters or fewer"),
  contactName: z
    .string()
    .min(1, "Contact name is required")
    .max(100, "Contact name must be 100 characters or fewer"),
  contactEmail: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
})

export type CreateClientInput = z.infer<typeof createClientSchema>

export const updateClientSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  companyName: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Company name must be 100 characters or fewer"),
  contactName: z
    .string()
    .min(1, "Contact name is required")
    .max(100, "Contact name must be 100 characters or fewer"),
  contactEmail: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
})

export type UpdateClientInput = z.infer<typeof updateClientSchema>
