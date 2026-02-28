import { createClient } from "@/lib/supabase/server"
import { getDeficiencyById } from "@/lib/queries/deficiencies"
import { getOrgJanitors } from "@/lib/queries/activities"
import { notFound } from "next/navigation"
import { DeficiencyDetail } from "./deficiency-detail"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"

export const metadata = {
  title: "Deficiency Detail - SpaceOps",
}

export default async function DeficiencyDetailPage({
  params,
}: {
  params: { org: string; id: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const role = user.app_metadata?.role as string | undefined
  if (role !== "admin" && role !== "supervisor") return notFound()

  let deficiency
  let janitors
  try {
    ;[deficiency, janitors] = await Promise.all([
      getDeficiencyById(supabase, params.id),
      getOrgJanitors(supabase),
    ])
  } catch {
    return notFound()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Breadcrumbs
        items={[
          {
            label: "Deficiencies",
            href: `/${params.org}/supervisor/deficiencies`,
          },
          { label: deficiency.description.slice(0, 40) },
        ]}
      />
      <DeficiencyDetail
        deficiency={deficiency}
        janitors={janitors}
        orgSlug={params.org}
      />
    </div>
  )
}
