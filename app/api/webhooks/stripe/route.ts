import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { planFromPriceId } from "@/lib/plans"
import type Stripe from "stripe"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const admin = createAdminClient()

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const orgId = session.metadata?.org_id
      if (!orgId || !session.customer) break

      await admin
        .from("organisations")
        .update({ stripe_customer_id: session.customer as string })
        .eq("id", orgId)

      break
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: org } = await admin
        .from("organisations")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single()

      if (!org) break

      const priceId = subscription.items.data[0]?.price.id || ""
      const plan = planFromPriceId(priceId)

      const sub = subscription as unknown as {
        id: string
        status: string
        current_period_start: number
        current_period_end: number
        cancel_at_period_end: boolean
        items: { data: { price: { id: string } }[] }
      }

      await admin.from("subscriptions").upsert(
        {
          org_id: org.id,
          stripe_subscription_id: sub.id,
          stripe_price_id: priceId,
          status: sub.status,
          current_period_start: new Date(
            sub.current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(
            sub.current_period_end * 1000
          ).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        },
        { onConflict: "stripe_subscription_id" }
      )

      const derivedPlan =
        subscription.status === "active" || subscription.status === "trialing"
          ? plan
          : "free"

      await admin
        .from("organisations")
        .update({ plan: derivedPlan })
        .eq("id", org.id)

      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: org } = await admin
        .from("organisations")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single()

      if (!org) break

      await admin
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_subscription_id", subscription.id)

      await admin
        .from("organisations")
        .update({ plan: "free" })
        .eq("id", org.id)

      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      console.warn(
        `Payment failed for customer: ${invoice.customer as string}`
      )
      break
    }
  }

  return NextResponse.json({ received: true })
}
