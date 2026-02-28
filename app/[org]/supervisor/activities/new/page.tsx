import { createClient } from "@/lib/supabase/server"
import { getOrgBuildings } from "@/lib/queries/buildings"
import { getOrgJanitors } from "@/lib/queries/activities"
import { ActivityWizard } from "./activity-wizard"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"

export const metadata = {
  title: "New Activity - SpaceOps",
}

export default async function NewActivityPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const [buildings, janitors] = await Promise.all([
    getOrgBuildings(supabase),
    getOrgJanitors(supabase),
  ])

  // Build a structure: buildings with their floors
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
      />
    </div>
  )
}
