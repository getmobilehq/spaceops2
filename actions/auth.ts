"use server"

import { createClient } from "@/lib/supabase/server"
import {
  loginSchema,
  setPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type SetPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

type ActionResult = { success: true } | { success: false; error: string }

export async function loginAction(
  input: LoginInput
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { success: false, error: "Invalid email or password" }
  }

  return { success: true }
}

export async function resetPasswordAction(
  input: ResetPasswordInput
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = createClient()
  const origin = headers().get("origin") || process.env.NEXT_PUBLIC_APP_URL

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${origin}/auth/callback?type=recovery`,
    }
  )

  if (error) {
    console.error("Password reset error:", error.message)
  }

  // Always return success to prevent email enumeration
  return { success: true }
}

export async function updatePasswordAction(
  input: SetPasswordInput
): Promise<ActionResult> {
  const parsed = setPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function signOutAction(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
