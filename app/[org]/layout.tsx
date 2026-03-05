import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { OrgProvider } from "@/components/shared/OrgProvider"
import type { Tables } from "@/lib/supabase/types"

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { org: string }
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data, error } = await supabase
    .from("organisations")
    .select("*")
    .eq("slug", params.org)
    .single()

  if (error || !data) {
    return notFound()
  }

  const org = data as Tables<"organisations">

  const userOrgId = user.app_metadata?.org_id
  if (userOrgId !== org.id) {
    redirect("/auth/login")
  }

  const { data: userRecord } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <OrgProvider
      value={{
        orgId: org.id,
        orgSlug: org.slug,
        orgName: org.name,
        passThreshold: org.pass_threshold,
        orgLogoUrl: org.logo_url,
        userId: user.id,
        userFirstName: userRecord?.first_name || "",
        userLastName: userRecord?.last_name || "",
        userAvatarUrl: userRecord?.avatar_url || null,
        userRole: userRecord?.role || (user.app_metadata?.role as string) || "",
        userEmail: user.email || "",
      }}
    >
      {children}
    </OrgProvider>
  )
}
