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
import { BuildingClockIn } from "./building-clock-in"
import { BuildingInfoCard } from "./building-info-card"

export const metadata = {
  title: "Building Attendance - SpaceOps",
}

export default async function BuildingScanPage({
  params,
}: {
  params: { buildingId: string }
}) {
  const admin = createAdminClient()

  const { data: building, error } = await admin
    .from("buildings")
    .select("id, name, address, org_id, latitude, longitude, geofence_radius_m")
    .eq("id", params.buildingId)
    .single()

  if (error || !building) return notFound()

  // Check if user is authenticated
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Not authenticated — show building info with login prompt
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-primary">{building.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{building.address}</p>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Sign in to clock in at this building.
              </p>
              <Button asChild className="w-full">
                <Link href={`/auth/login?next=/scan/building/${params.buildingId}`}>
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

  // Security: verify building belongs to user's org
  if (building.org_id !== userOrgId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              This building does not belong to your organisation.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Janitor → show clock-in component
  if (role === "janitor") {
    // Check today's attendance
    const today = new Date().toISOString().split("T")[0]
    const { data: existing } = await supabase
      .from("attendance_records")
      .select("id, clock_in_at, clock_out_at, geo_verified, distance_m")
      .eq("building_id", params.buildingId)
      .eq("user_id", user.id)
      .eq("date", today)
      .limit(1)
      .maybeSingle()

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <BuildingClockIn
          building={{
            id: building.id,
            name: building.name,
            address: building.address,
            hasLocation: building.latitude != null && building.longitude != null,
          }}
          orgSlug={orgSlug || ""}
          existingAttendance={
            existing
              ? {
                  id: existing.id,
                  clockInAt: existing.clock_in_at,
                  clockOutAt: existing.clock_out_at,
                  geoVerified: existing.geo_verified,
                  distanceM: existing.distance_m,
                }
              : null
          }
        />
      </div>
    )
  }

  // Supervisor/Admin → redirect to attendance dashboard
  if ((role === "supervisor" || role === "admin") && orgSlug) {
    redirect(`/${orgSlug}/supervisor/attendance`)
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <BuildingInfoCard buildingName={building.name} address={building.address} />
    </div>
  )
}
