import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { OnboardingWizard } from "./onboarding-wizard"

export default async function OnboardingPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: org } = await supabase
    .from("organisations")
    .select("id, slug, name, onboarding_completed, plan")
    .eq("slug", params.org)
    .single()

  if (!org) return notFound()

  if (org.onboarding_completed) {
    redirect(`/${org.slug}/admin/dashboard`)
  }

  const { data: userRecord } = await supabase
    .from("users")
    .select("first_name")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <OnboardingWizard
          orgSlug={org.slug}
          orgName={org.name}
          firstName={userRecord?.first_name || "there"}
          plan={(org.plan as string) || "free"}
        />
      </div>
    </div>
  )
}
