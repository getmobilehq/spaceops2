import { createClient } from "@/lib/supabase/server"
import { getFloorById, getBuildingById } from "@/lib/queries/buildings"
import { getFloorRooms, getOrgRoomTypes } from "@/lib/queries/rooms"
import { getOrgTemplates } from "@/lib/queries/checklists"
import { notFound } from "next/navigation"
import { FloorSetupForm } from "./floor-setup-form"
import { RoomManager } from "./room-manager"
import { FloorPlanEditor } from "./floor-plan-editor"

export const metadata = {
  title: "Floor Setup - SpaceOps",
}

export default async function FloorDetailPage({
  params,
}: {
  params: { org: string; id: string; fid: string }
}) {
  const supabase = createClient()

  let floor
  let building
  let rooms
  let roomTypes
  let templates
  try {
    ;[floor, building, rooms, roomTypes, templates] = await Promise.all([
      getFloorById(supabase, params.fid),
      getBuildingById(supabase, params.id),
      getFloorRooms(supabase, params.fid),
      getOrgRoomTypes(supabase),
      getOrgTemplates(supabase),
    ])
  } catch {
    return notFound()
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

  // Prepare rooms for editor
  const editorRooms = rooms.map((r: any) => ({
    id: r.id,
    name: r.name,
    pin_x: r.pin_x,
    pin_y: r.pin_y,
    room_types: r.room_types,
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">{floor.floor_name}</h1>
        <p className="text-muted-foreground">
          Floor #{floor.floor_number} · {building.name}
        </p>
      </div>
      <FloorSetupForm
        floor={floor}
        buildingId={params.id}
        orgSlug={params.org}
      />
      <RoomManager
        rooms={rooms}
        roomTypes={roomTypes}
        templates={templates}
        floorId={params.fid}
        orgSlug={params.org}
        buildingId={params.id}
      />
      <FloorPlanEditor
        rooms={editorRooms}
        floorPlanUrl={floorPlanUrl}
      />
    </div>
  )
}
