import { createClient } from "@/lib/supabase/server"
import { getFloorById, getBuildingById } from "@/lib/queries/buildings"
import { getFloorRooms, getOrgRoomTypes } from "@/lib/queries/rooms"
import { getOrgTemplates } from "@/lib/queries/checklists"
import { notFound } from "next/navigation"
import { FloorSetupForm } from "./floor-setup-form"
import { RoomManager } from "./room-manager"
import { VectorisationPanel } from "./vectorisation-panel"
import type { ExtractionResult } from "@/lib/validations/vectorisation"

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
  const plan = floor.vectorised_plans as {
    original_path: string
    extraction_status?: string
    extraction_error?: string | null
    extracted_data?: Record<string, unknown> | null
  } | null
  if (plan?.original_path) {
    const { data: urlData } = await supabase.storage
      .from("floor-plans")
      .createSignedUrl(plan.original_path, 3600)
    floorPlanUrl = urlData?.signedUrl || null
  }

  // Prepare vectorisation data
  const extractionStatus = plan?.extraction_status || "pending"
  const extractionError = plan?.extraction_error || null
  const extractedData = (plan?.extracted_data as ExtractionResult | null) || null

  // Prepare existing rooms for matching
  const existingRoomsForMatch = rooms.map((r: (typeof rooms)[number]) => ({
    id: r.id,
    name: r.name,
    roomTypeName: (r.room_types as { name: string } | null)?.name || "Unknown",
  }))

  // Prepare room types for the review UI
  const roomTypeOptions = roomTypes.map((rt: (typeof roomTypes)[number]) => ({
    id: rt.id,
    name: rt.name,
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{floor.floor_name}</h1>
        <p className="text-muted-foreground">
          Floor #{floor.floor_number} · {building.name}
        </p>
      </div>
      <FloorSetupForm
        floor={floor}
        buildingId={params.id}
        orgSlug={params.org}
      />
      {floorPlanUrl && (
        <VectorisationPanel
          floorId={params.fid}
          floorPlanUrl={floorPlanUrl}
          extractionStatus={extractionStatus}
          extractionError={extractionError}
          extractedData={extractedData}
          existingRooms={existingRoomsForMatch}
          roomTypes={roomTypeOptions}
          isConfirmed={floor.plan_status === "confirmed"}
        />
      )}
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
