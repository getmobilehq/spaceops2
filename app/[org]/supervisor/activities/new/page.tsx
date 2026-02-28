import { createClient } from "@/lib/supabase/server"
import { getOrgBuildings } from "@/lib/queries/buildings"
import { getOrgJanitors } from "@/lib/queries/activities"
import { getActivityTemplateById } from "@/lib/queries/activity-templates"
import { ActivityWizard } from "./activity-wizard"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"

export const metadata = {
  title: "New Activity - SpaceOps",
}

export default async function NewActivityPage({
  params,
  searchParams,
}: {
  params: { org: string }
  searchParams: { templateId?: string }
}) {
  const supabase = createClient()
  const [buildings, janitors] = await Promise.all([
    getOrgBuildings(supabase),
    getOrgJanitors(supabase),
  ])

  // Fetch template if templateId provided
  let initialValues: {
    floorId: string
    buildingId: string
    windowStart: string
    windowEnd: string
    notes: string
    defaultAssignments: { room_id: string; assigned_to: string }[]
  } | undefined

  if (searchParams.templateId) {
    try {
      const template = await getActivityTemplateById(supabase, searchParams.templateId)
      const buildingId = template.floors?.building_id || ""
      initialValues = {
        floorId: template.floor_id,
        buildingId,
        windowStart: template.window_start.slice(0, 5),
        windowEnd: template.window_end.slice(0, 5),
        notes: template.notes || "",
        defaultAssignments: Array.isArray(template.default_assignments)
          ? (template.default_assignments as { room_id: string; assigned_to: string }[])
          : [],
      }
    } catch {
      // Template not found, proceed without pre-fill
    }
  }

  const buildingsWithFloors = buildings.map((b) => ({
    id: b.id,
    name: b.name,
    floors: (b.floors || []).map((f: { id: string }) => f),
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Activities", href: `/${params.org}/supervisor/activities` },
          { label: "New Activity" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-brand">New Activity</h1>
        <p className="text-muted-foreground">
          Create a cleaning activity for a floor
        </p>
      </div>
      <ActivityWizard
        buildings={buildingsWithFloors}
        janitors={janitors}
        orgSlug={params.org}
        initialValues={initialValues}
      />
    </div>
  )
}
