import { z } from "zod"

export const createCheckoutSchema = z.object({
  priceId: z.string().min(1, "Price ID is required"),
})

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>
