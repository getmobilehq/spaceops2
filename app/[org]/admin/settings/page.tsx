import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/types"
import { notFound } from "next/navigation"
import { SettingsForm } from "./settings-form"

export const metadata = {
  title: "Settings - SpaceOps",
}

export default async function SettingsPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const orgId = user.app_metadata?.org_id as string | undefined
  if (!orgId) return notFound()

  const { data, error } = await supabase
    .from("organisations")
    .select("*")
    .eq("id", orgId)
    .single()

  if (error || !data) return notFound()

  const org = data as Tables<"organisations">

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organisation settings
        </p>
      </div>
      <SettingsForm org={org} />
    </div>
  )
}
