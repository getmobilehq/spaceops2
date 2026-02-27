import { createClient } from "@/lib/supabase/server"
import { getFloorById, getBuildingById } from "@/lib/queries/buildings"
import { getFloorRooms, getOrgRoomTypes } from "@/lib/queries/rooms"
import { getOrgTemplates } from "@/lib/queries/checklists"
import { notFound } from "next/navigation"
import { FloorSetupForm } from "./floor-setup-form"
import { RoomManager } from "./room-manager"

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
    </div>
  )
}
