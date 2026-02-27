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

  return (
    <OrgProvider
      value={{
        orgId: org.id,
        orgSlug: org.slug,
        orgName: org.name,
        passThreshold: org.pass_threshold,
        orgLogoUrl: org.logo_url,
      }}
    >
      {children}
    </OrgProvider>
  )
}
