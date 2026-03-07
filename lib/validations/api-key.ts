import { z } from "zod"

export const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, "API key name is required")
    .max(50, "Name must be 50 characters or fewer"),
})

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>

export const revokeApiKeySchema = z.object({
  keyId: z.string().uuid("Invalid API key ID"),
})

export type RevokeApiKeyInput = z.infer<typeof revokeApiKeySchema>
