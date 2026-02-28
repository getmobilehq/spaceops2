import { createClient } from "@/lib/supabase/server"
import { getActivityTemplateById } from "@/lib/queries/activity-templates"
import { getOrgJanitors } from "@/lib/queries/activities"
import { TemplateDetail } from "./template-detail"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Template Details - SpaceOps",
}

export default async function TemplateDetailPage({
  params,
}: {
  params: { org: string; id: string }
}) {
  const supabase = createClient()

  let template
  try {
    template = await getActivityTemplateById(supabase, params.id)
  } catch {
    notFound()
  }

  const janitors = await getOrgJanitors(supabase)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Templates", href: `/${params.org}/supervisor/templates` },
          { label: template.name },
        ]}
      />
      <TemplateDetail
        template={template}
        janitors={janitors}
        orgSlug={params.org}
      />
    </div>
  )
}
