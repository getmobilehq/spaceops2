import { createClient } from "@/lib/supabase/server"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getSupervisorBuildingAttendance } from "@/lib/queries/attendance"
import { getSupervisorBuildings } from "@/lib/queries/activities"
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Building2,
} from "lucide-react"

export const metadata = {
  title: "Attendance - SpaceOps",
}

export default async function SupervisorAttendancePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const records = user ? await getSupervisorBuildingAttendance(supabase, user.id) : []
  const buildings = user ? await getSupervisorBuildings(supabase, user.id) : []

  // Group by building
  const grouped = new Map<
    string,
    { buildingName: string; records: typeof records }
  >()

  for (const record of records) {
    const b = record.buildings as { name: string } | null
    const key = record.building_id
    if (!grouped.has(key)) {
      grouped.set(key, {
        buildingName: b?.name || "Unknown Building",
        records: [],
      })
    }
    grouped.get(key)!.records.push(record)
  }

  // Add buildings with no attendance
  for (const b of buildings) {
    if (b && !grouped.has(b.id)) {
      grouped.set(b.id, { buildingName: b.name, records: [] })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Attendance</h1>
        <p className="text-muted-foreground">
          Today&apos;s attendance across your buildings
        </p>
      </div>

      {grouped.size === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No buildings assigned. Buildings will be assigned by your admin.
            </p>
          </CardContent>
        </Card>
      ) : (
        Array.from(grouped.entries()).map(([buildingId, group]) => (
          <Card key={buildingId}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {group.buildingName}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {group.records.length} clocked in
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {group.records.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No janitors have clocked in today.
                </p>
              ) : (
                <div className="space-y-2">
                  {group.records.map((record) => {
                    const u = record.users as {
                      id: string
                      first_name: string
                      last_name: string
                    } | null
                    const clockIn = new Date(
                      record.clock_in_at
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    const clockOut = record.clock_out_at
                      ? new Date(record.clock_out_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : null

                    return (
                      <div
                        key={record.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {u
                              ? `${u.first_name} ${u.last_name}`
                              : "Unknown"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {clockIn}
                              {clockOut ? ` – ${clockOut}` : ""}
                            </span>
                            {record.distance_m != null && (
                              <>
                                <span>·</span>
                                <MapPin className="h-3 w-3" />
                                <span>{record.distance_m}m</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            record.geo_verified
                              ? "border-success/30 bg-success/10 text-success dark:bg-success/20"
                              : "border-warning/30 bg-warning/10 text-warning dark:bg-warning/20"
                          }
                        >
                          {record.geo_verified ? (
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                          ) : (
                            <AlertTriangle className="mr-1 h-3 w-3" />
                          )}
                          {record.geo_verified ? "Verified" : "Unverified"}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
