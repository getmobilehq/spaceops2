"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"
import {
  createCheckoutSchema,
  type CreateCheckoutInput,
} from "@/lib/validations/billing"
import { headers } from "next/headers"

type ActionResult =
  | { success: true; url: string }
  | { success: false; error: string }

async function getAdminContext() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const role = user.app_metadata?.role as string | undefined
  const orgId = user.app_metadata?.org_id as string | undefined

  if (role !== "admin" || !orgId) return null

  return { user, orgId, supabase }
}

export async function createCheckoutSession(
  input: CreateCheckoutInput
): Promise<ActionResult> {
  const parsed = createCheckoutSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const origin = headers().get("origin") || process.env.NEXT_PUBLIC_APP_URL
  const orgSlug = ctx.user.app_metadata?.org_slug as string

  const { data: org } = await ctx.supabase
    .from("organisations")
    .select("stripe_customer_id, name")
    .eq("id", ctx.orgId)
    .single()

  if (!org) return { success: false, error: "Organisation not found" }

  const stripe = getStripe()
  let customerId = org.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: ctx.user.email,
      name: org.name,
      metadata: { org_id: ctx.orgId },
    })
    customerId = customer.id

    const admin = createAdminClient()
    await admin
      .from("organisations")
      .update({ stripe_customer_id: customerId })
      .eq("id", ctx.orgId)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: parsed.data.priceId, quantity: 1 }],
    success_url: `${origin}/${orgSlug}/admin/billing?success=true`,
    cancel_url: `${origin}/${orgSlug}/admin/billing?canceled=true`,
    metadata: { org_id: ctx.orgId },
  })

  if (!session.url) {
    return { success: false, error: "Failed to create checkout session" }
  }

  return { success: true, url: session.url }
}

export async function createCustomerPortalSession(): Promise<ActionResult> {
  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const origin = headers().get("origin") || process.env.NEXT_PUBLIC_APP_URL
  const orgSlug = ctx.user.app_metadata?.org_slug as string

  const { data: org } = await ctx.supabase
    .from("organisations")
    .select("stripe_customer_id")
    .eq("id", ctx.orgId)
    .single()

  if (!org?.stripe_customer_id) {
    return { success: false, error: "No billing account found" }
  }

  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${origin}/${orgSlug}/admin/billing`,
  })

  return { success: true, url: session.url }
}
