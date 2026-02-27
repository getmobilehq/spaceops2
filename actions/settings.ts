"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  updateOrgSettingsSchema,
  type UpdateOrgSettingsInput,
} from "@/lib/validations/settings"

type ActionResult = { success: true } | { success: false; error: string }

export async function updateOrgSettings(
  input: UpdateOrgSettingsInput
): Promise<ActionResult> {
  const parsed = updateOrgSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const role = user.app_metadata?.role as string | undefined
  const orgId = user.app_metadata?.org_id as string | undefined

  if (role !== "admin" || !orgId) {
    return { success: false, error: "Unauthorized" }
  }

  // RLS policy ensures admin can only update own org
  const { error } = await supabase
    .from("organisations")
    .update({
      name: parsed.data.name,
      pass_threshold: parsed.data.passThreshold,
    })
    .eq("id", orgId)

  if (error) {
    return { success: false, error: "Failed to update settings" }
  }

  return { success: true }
}

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

export async function uploadOrgLogo(
  formData: FormData
): Promise<ActionResult> {
  const file = formData.get("logo") as File | null
  if (!file || file.size === 0) {
    return { success: false, error: "No file provided" }
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Invalid file type. Please upload a JPEG, PNG, WebP, or SVG",
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "File must be smaller than 2MB" }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const role = user.app_metadata?.role as string | undefined
  const orgId = user.app_metadata?.org_id as string | undefined

  if (role !== "admin" || !orgId) {
    return { success: false, error: "Unauthorized" }
  }

  const ext = file.name.split(".").pop() || "png"
  const filePath = `${orgId}/logo.${ext}`

  // Upload to org-assets bucket (RLS policy scoped to org)
  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from("org-assets")
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    return { success: false, error: "Failed to upload logo" }
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = admin.storage.from("org-assets").getPublicUrl(filePath)

  // Save URL to org record
  const { error: updateError } = await supabase
    .from("organisations")
    .update({ logo_url: publicUrl })
    .eq("id", orgId)

  if (updateError) {
    return { success: false, error: "Failed to save logo URL" }
  }

  return { success: true }
}
