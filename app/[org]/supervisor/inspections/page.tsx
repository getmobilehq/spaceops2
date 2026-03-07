import { createClient } from "@/lib/supabase/server"
import {
  getSupervisorInspections,
  getSupervisorBuildingsWithRooms,
  getInspectionStats,
} from "@/lib/queries/inspections"
import { InspectionListView } from "./inspection-list-view"

export const metadata = {
  title: "Inspections - SpaceOps",
}

export default async function InspectionsPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [inspections, buildings, stats] = await Promise.all([
    getSupervisorInspections(supabase, user.id),
    getSupervisorBuildingsWithRooms(supabase, user.id),
    getInspectionStats(supabase, user.id),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Inspections</h1>
        <p className="text-muted-foreground">
          Inspect any room in your assigned buildings
        </p>
      </div>
      <InspectionListView
        inspections={inspections}
        buildings={buildings}
        stats={stats}
        orgSlug={params.org}
      />
    </div>
  )
}
