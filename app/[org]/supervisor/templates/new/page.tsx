import { createClient } from "@/lib/supabase/server"
import { getOrgBuildings } from "@/lib/queries/buildings"
import { getOrgJanitors } from "@/lib/queries/activities"
import { TemplateForm } from "./template-form"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"

export const metadata = {
  title: "New Template - SpaceOps",
}

export default async function NewTemplatePage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const [buildings, janitors] = await Promise.all([
    getOrgBuildings(supabase),
    getOrgJanitors(supabase),
  ])

  const buildingsSimple = buildings.map((b) => ({ id: b.id, name: b.name }))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Templates", href: `/${params.org}/supervisor/templates` },
          { label: "New Template" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-brand">New Template</h1>
        <p className="text-muted-foreground">
          Create a reusable activity configuration
        </p>
      </div>
      <TemplateForm
        buildings={buildingsSimple}
        janitors={janitors}
        orgSlug={params.org}
      />
    </div>
  )
}
