"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from "@/lib/validations/profile"

type ActionResult = { success: true } | { success: false; error: string }

export async function updateProfile(
  input: UpdateProfileInput
): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse(input)
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

  const orgId = user.app_metadata?.org_id as string | undefined
  const role = user.app_metadata?.role as
    | "admin"
    | "supervisor"
    | "janitor"
    | "client"
    | undefined
  if (!orgId || !role) {
    return { success: false, error: "Unauthorized" }
  }

  const admin = createAdminClient()

  // Upsert so the write self-heals if the public.users row is missing.
  // org_id/role come from the verified JWT to satisfy NOT NULL columns
  // on a fresh insert; ON CONFLICT updates the existing row in place.
  const { error } = await admin.from("users").upsert(
    {
      id: user.id,
      org_id: orgId,
      role,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
    },
    { onConflict: "id" }
  )

  if (error) {
    return { success: false, error: "Failed to update profile" }
  }

  // Sync to auth metadata
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
    },
  })

  return { success: true }
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

export async function uploadAvatar(
  formData: FormData
): Promise<ActionResult> {
  const file = formData.get("avatar") as File | null
  if (!file || file.size === 0) {
    return { success: false, error: "No file provided" }
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Invalid file type. Please upload a JPEG, PNG, or WebP",
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

  const orgId = user.app_metadata?.org_id as string | undefined
  if (!orgId) {
    return { success: false, error: "Unauthorized" }
  }

  const ext = file.name.split(".").pop() || "png"
  const filePath = `${orgId}/avatars/${user.id}.${ext}`

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from("org-assets")
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    return { success: false, error: "Failed to upload avatar" }
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("org-assets").getPublicUrl(filePath)

  // Update public.users avatar_url (admin client; RLS already enforced
  // above via the authenticated session + org scoping).
  const { data: updatedRows, error: updateError } = await admin
    .from("users")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id)
    .select("id")

  if (updateError) {
    return { success: false, error: "Failed to save avatar URL" }
  }

  // Self-heal: create the profile row if it was missing (preserves any
  // existing name rather than clobbering it via blind upsert).
  if (!updatedRows || updatedRows.length === 0) {
    const role = user.app_metadata?.role as
      | "admin"
      | "supervisor"
      | "janitor"
      | "client"
      | undefined
    if (!role) {
      return { success: false, error: "Unauthorized" }
    }
    const { error: insertError } = await admin.from("users").insert({
      id: user.id,
      org_id: orgId,
      role,
      first_name:
        (user.user_metadata?.first_name as string) ||
        (user.email ?? "user").split("@")[0],
      last_name: (user.user_metadata?.last_name as string) || "User",
      avatar_url: publicUrl,
    })
    if (insertError) {
      return { success: false, error: "Failed to save avatar URL" }
    }
  }

  // Sync to auth metadata
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { avatar_url: publicUrl },
  })

  return { success: true }
}

export async function changePassword(
  input: ChangePasswordInput
): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { success: false, error: "Unauthorized" }
  }

  // Verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  })

  if (signInError) {
    return { success: false, error: "Current password is incorrect" }
  }

  // Update to new password
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
