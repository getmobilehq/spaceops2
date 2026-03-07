import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export async function getSupervisorInspections(
  supabase: SupabaseClient<Database>,
  userId: string,
  options?: { status?: string; buildingId?: string }
) {
  let query = supabase
    .from("inspections")
    .select(
      "*, rooms(name, room_types(name)), floors(floor_name), buildings(name)"
    )
    .eq("inspector_id", userId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status as "pending" | "passed" | "failed")
  }
  if (options?.buildingId) {
    query = query.eq("building_id", options.buildingId)
  }

  const { data } = await query
  return data || []
}

export async function getInspectionById(
  supabase: SupabaseClient<Database>,
  inspectionId: string
) {
  const { data, error } = await supabase
    .from("inspections")
    .select(
      "*, rooms(id, name, room_types(name)), floors(floor_name), buildings(name)"
    )
    .eq("id", inspectionId)
    .single()

  if (error) throw error
  return data
}

export async function getSupervisorBuildingsWithRooms(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  // Get buildings assigned to this supervisor
  const { data: assignments } = await supabase
    .from("building_supervisors")
    .select("building_id, buildings(id, name, address)")
    .eq("user_id", userId)

  if (!assignments || assignments.length === 0) return []

  const buildingIds = assignments.map((a) => a.building_id)

  // Get floors and rooms for those buildings
  const { data: floors } = await supabase
    .from("floors")
    .select(
      "id, floor_name, building_id, rooms(id, name, is_active, room_types(name))"
    )
    .in("building_id", buildingIds)
    .order("floor_number", { ascending: true })

  type BuildingEntry = {
    id: string
    name: string
    address: string
    floors: {
      id: string
      floorName: string
      rooms: { id: string; name: string; roomType: string }[]
    }[]
  }

  const buildingMap = new Map<string, BuildingEntry>()

  for (const a of assignments) {
    const b = a.buildings as { id: string; name: string; address: string } | null
    if (!b) continue
    buildingMap.set(b.id, {
      id: b.id,
      name: b.name,
      address: b.address,
      floors: [],
    })
  }

  for (const f of floors || []) {
    const building = buildingMap.get(f.building_id)
    if (!building) continue
    const activeRooms = ((f.rooms as Array<{ id: string; name: string; is_active: boolean; room_types: { name: string } | null }>) || [])
      .filter((r) => r.is_active)
      .map((r) => ({
        id: r.id,
        name: r.name,
        roomType: r.room_types?.name || "",
      }))
    building.floors.push({
      id: f.id,
      floorName: f.floor_name,
      rooms: activeRooms,
    })
  }

  return Array.from(buildingMap.values())
}

export async function getInspectionStats(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const { data } = await supabase
    .from("inspections")
    .select("status")
    .eq("inspector_id", userId)

  const all = data || []
  return {
    total: all.length,
    pending: all.filter((i) => i.status === "pending").length,
    passed: all.filter((i) => i.status === "passed").length,
    failed: all.filter((i) => i.status === "failed").length,
  }
}
