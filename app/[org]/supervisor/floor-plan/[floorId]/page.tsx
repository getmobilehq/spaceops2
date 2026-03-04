import { createClient } from "@/lib/supabase/server"
import { getFloorById, getBuildingById } from "@/lib/queries/buildings"
import { getFloorRoomsWithStatus } from "@/lib/queries/rooms"
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { FloorPlanView } from "./floor-plan-view"

export const metadata = {
  title: "Floor Plan - SpaceOps",
}

export default async function FloorPlanPage({
  params,
}: {
  params: { org: string; floorId: string }
}) {
  const supabase = createClient()

  let floor
  let rooms
  try {
    floor = await getFloorById(supabase, params.floorId)
    rooms = await getFloorRoomsWithStatus(supabase, params.floorId)
  } catch {
    return notFound()
  }

  // Get building name from floor's building_id
  let buildingName = ""
  try {
    const building = await getBuildingById(supabase, floor.building_id)
    buildingName = building.name
  } catch {
    // non-critical
  }

  // Get floor plan URL if uploaded
  let floorPlanUrl: string | null = null
  const plan = floor.vectorised_plans as { original_path: string } | null
  if (plan?.original_path) {
    const { data: urlData } = await supabase.storage
      .from("floor-plans")
      .createSignedUrl(plan.original_path, 3600)
    floorPlanUrl = urlData?.signedUrl || null
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Activities", href: `/${params.org}/supervisor/activities` },
          { label: `${buildingName} - ${floor.floor_name}` },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{floor.floor_name}</h1>
        <p className="text-muted-foreground">
          Floor #{floor.floor_number} · {buildingName}
        </p>
      </div>
      <FloorPlanView
        rooms={rooms}
        floorPlanUrl={floorPlanUrl}
        floorName={floor.floor_name}
      />
    </div>
  )
}
