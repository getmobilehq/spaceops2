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

  // Resolve room names for default_assignments
  const assignments = Array.isArray(template.default_assignments)
    ? (template.default_assignments as { room_id: string; assigned_to: string }[])
    : []
  const roomIds = assignments.map((a) => a.room_id)
  const roomMap: Record<string, string> = {}
  if (roomIds.length > 0) {
    const { data: rooms } = await supabase
      .from("rooms")
      .select("id, name")
      .in("id", roomIds)
    for (const r of rooms || []) {
      roomMap[r.id] = r.name
    }
  }

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
        roomMap={roomMap}
        orgSlug={params.org}
      />
    </div>
  )
}
