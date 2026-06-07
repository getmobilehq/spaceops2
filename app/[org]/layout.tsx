import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { headers } from "next/headers"
import { OrgProvider } from "@/components/shared/OrgProvider"
import { I18nProvider } from "@/lib/i18n/client"
import { getLocale } from "@/lib/i18n/server"
import { getDictionary } from "@/lib/i18n/get-dictionary"
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

  // Block suspended orgs (super admins bypass via /platform routes)
  if (org.suspended_at) {
    redirect("/auth/suspended")
  }

  const { data: userRecord } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  const locale = getLocale()
  const dict = await getDictionary(locale)

  // Guide brand-new admins to the onboarding wizard, but ONLY from the dashboard
  // landing — never from deep pages. A blanket redirect here re-fires on every
  // router.refresh() after a mutation (Next.js caches this layout across SPA
  // navigations but re-runs it on a refresh), which surfaced as the
  // "Something went wrong" / white-screen bounce-to-onboarding reported across
  // every admin CRUD flow even though the underlying writes succeeded.
  const headerList = headers()
  const pathname = headerList.get("x-pathname") || ""
  if (
    org.onboarding_completed === false &&
    userRecord?.role === "admin" &&
    pathname.endsWith("/admin/dashboard")
  ) {
    redirect(`/${org.slug}/admin/onboarding`)
  }

  return (
    <I18nProvider locale={locale} dict={dict}>
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
          plan: org.plan || "free",
          onboardingCompleted: org.onboarding_completed ?? true,
          isSuperAdmin: user.app_metadata?.is_super_admin === true,
        }}
      >
        {children}
      </OrgProvider>
    </I18nProvider>
  )
}
