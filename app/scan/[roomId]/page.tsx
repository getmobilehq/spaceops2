import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RoomInfoCard } from "./room-info-card"

export const metadata = {
  title: "Room Scan - SpaceOps",
}

export default async function ScanPage({
  params,
}: {
  params: { roomId: string }
}) {
  // Use admin client to fetch room data (no RLS, works for unauthenticated)
  const admin = createAdminClient()

  const { data: room, error } = await admin
    .from("rooms")
    .select("*, room_types(name), floors(id, floor_name, floor_number, building_id)")
    .eq("id", params.roomId)
    .single()

  if (error || !room) return notFound()

  const floor = room.floors as {
    id: string
    floor_name: string
    floor_number: number
    building_id: string
  } | null

  // Fetch building name
  let buildingName = "Unknown Building"
  if (floor?.building_id) {
    const { data: building } = await admin
      .from("buildings")
      .select("name")
      .eq("id", floor.building_id)
      .single()
    if (building) buildingName = building.name
  }

  // Check if user is authenticated
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const roomInfo = {
    name: room.name,
    typeName: (room.room_types as { name: string } | null)?.name || "Unknown",
    floorName: floor?.floor_name || "Unknown Floor",
    buildingName,
    isActive: room.is_active,
  }

  // Not authenticated — show room info with login prompt
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="w-full max-w-md space-y-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-brand">{roomInfo.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {roomInfo.buildingName} · {roomInfo.floorName}
              </p>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Sign in to interact with this room.
              </p>
              <Button asChild className="w-full">
                <Link href={`/auth/login?next=/scan/${params.roomId}`}>
                  Sign In
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Authenticated — role-aware routing
  const role = user.app_metadata?.role as string | undefined
  const orgSlug = user.app_metadata?.org_slug as string | undefined
  const userOrgId = user.app_metadata?.org_id as string | undefined

  // Security: verify room belongs to user's org
  if (room.org_id !== userOrgId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              This room does not belong to your organisation.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Janitor → redirect to active task for this room if one exists today
  if (role === "janitor" && orgSlug) {
    const today = new Date().toISOString().split("T")[0]
    const { data: activeTask } = await supabase
      .from("room_tasks")
      .select("id, cleaning_activities!inner(scheduled_date, status)")
      .eq("room_id", params.roomId)
      .eq("assigned_to", user.id)
      .eq("cleaning_activities.scheduled_date", today)
      .eq("cleaning_activities.status", "active")
      .in("status", ["not_started", "in_progress"])
      .limit(1)
      .maybeSingle()

    if (activeTask) {
      redirect(`/${orgSlug}/janitor/task/${activeTask.id}`)
    }
  }

  // Admin → redirect to floor management page
  if (role === "admin" && orgSlug && floor) {
    redirect(
      `/${orgSlug}/admin/buildings/${floor.building_id}/floors/${floor.id}`
    )
  }

  // All other roles — show room info card
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <RoomInfoCard room={roomInfo} role={role || "unknown"} />
    </div>
  )
}
