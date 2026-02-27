"use server"

import { createClient } from "@/lib/supabase/server"
import {
  createClientSchema,
  updateClientSchema,
  type CreateClientInput,
  type UpdateClientInput,
} from "@/lib/validations/client"

type ActionResult = { success: true } | { success: false; error: string }
type ActionResultWithId =
  | { success: true; id: string }
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

export async function createNewClient(
  input: CreateClientInput
): Promise<ActionResultWithId> {
  const parsed = createClientSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { data, error } = await ctx.supabase
    .from("clients")
    .insert({
      org_id: ctx.orgId,
      company_name: parsed.data.companyName,
      contact_name: parsed.data.contactName,
      contact_email: parsed.data.contactEmail,
    })
    .select("id")
    .single()

  if (error || !data) {
    return { success: false, error: "Failed to create client" }
  }

  return { success: true, id: data.id }
}

export async function updateClient(
  input: UpdateClientInput
): Promise<ActionResult> {
  const parsed = updateClientSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { error } = await ctx.supabase
    .from("clients")
    .update({
      company_name: parsed.data.companyName,
      contact_name: parsed.data.contactName,
      contact_email: parsed.data.contactEmail,
    })
    .eq("id", parsed.data.clientId)

  if (error) return { success: false, error: "Failed to update client" }
  return { success: true }
}
