"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"
import {
  registerSchema,
  type RegisterInput,
} from "@/lib/validations/register"

type RegisterResult =
  | { success: true; orgSlug: string }
  | { success: false; error: string }

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export async function registerOrg(
  input: RegisterInput
): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const admin = createAdminClient()
  const { orgName, firstName, lastName, email, password } = parsed.data

  // Generate unique slug
  let slug = slugify(orgName)
  if (!slug) slug = "org"

  const { data: existing } = await admin
    .from("organisations")
    .select("id")
    .eq("slug", slug)
    .single()

  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`
  }

  // 1. Create organisation (triggers seed room types + checklists)
  const { data: org, error: orgError } = await admin
    .from("organisations")
    .insert({ name: orgName, slug })
    .select("id, slug")
    .single()

  if (orgError || !org) {
    return { success: false, error: "Failed to create organisation" }
  }

  // 2. Create auth user
  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        org_id: org.id,
        org_slug: org.slug,
        role: "admin",
      },
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    })

  if (authError || !authData.user) {
    // Rollback org
    await admin.from("organisations").delete().eq("id", org.id)
    if (authError?.message.includes("already been registered")) {
      return {
        success: false,
        error: "A user with this email already exists",
      }
    }
    return {
      success: false,
      error: authError?.message || "Failed to create user",
    }
  }

  // 3. Insert into public.users (triggers metadata sync)
  const { error: userError } = await admin.from("users").insert({
    id: authData.user.id,
    org_id: org.id,
    first_name: firstName,
    last_name: lastName,
    role: "admin",
  })

  if (userError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    await admin.from("organisations").delete().eq("id", org.id)
    return { success: false, error: "Failed to create user record" }
  }

  // 4. Send welcome email (non-fatal)
  try {
    const { welcomeEmail } = await import("@/lib/email/templates")
    const { sendEmail } = await import("@/lib/email/send")
    const tmpl = welcomeEmail({
      firstName,
      orgName,
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
    })
    await sendEmail({ to: email, ...tmpl })
  } catch (err) {
    console.error("Welcome email failed:", err)
  }

  // 5. Create Stripe customer (non-fatal)
  try {
    const stripe = getStripe()
    const customer = await stripe.customers.create({
      email,
      name: orgName,
      metadata: { org_id: org.id },
    })

    await admin
      .from("organisations")
      .update({ stripe_customer_id: customer.id })
      .eq("id", org.id)
  } catch (err) {
    console.error("Failed to create Stripe customer:", err)
  }

  return { success: true, orgSlug: org.slug }
}
