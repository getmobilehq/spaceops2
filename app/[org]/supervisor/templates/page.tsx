import { createClient } from "@/lib/supabase/server"
import { getActivityTemplates } from "@/lib/queries/activity-templates"
import { TemplateList } from "./template-list"

export const metadata = {
  title: "Templates - SpaceOps",
}

export default async function TemplatesPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const templates = await getActivityTemplates(supabase)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Activity Templates</h1>
        <p className="text-muted-foreground">
          Save and reuse activity configurations
        </p>
      </div>
      <TemplateList templates={templates} orgSlug={params.org} />
    </div>
  )
}
