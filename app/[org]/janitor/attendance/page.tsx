import { createClient } from "@/lib/supabase/server"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getJanitorAttendanceHistory } from "@/lib/queries/attendance"
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react"

export const metadata = {
  title: "Attendance History - SpaceOps",
}

export default async function JanitorAttendancePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const records = user
    ? await getJanitorAttendanceHistory(supabase, user.id, { limit: 30 })
    : []

  // Group by date
  const grouped = new Map<string, typeof records>()
  for (const record of records) {
    const dateKey = record.date
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push(record)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Attendance</h1>
        <p className="text-muted-foreground text-sm">Your clock-in history</p>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No attendance records yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        Array.from(grouped.entries()).map(([date, dayRecords]) => (
          <Card key={date}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {new Date(date + "T00:00:00").toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dayRecords.map((record) => {
                const building = record.buildings as { name: string } | null
                const clockIn = new Date(record.clock_in_at).toLocaleTimeString([], {
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
                        {building?.name || "Unknown Building"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {clockIn}
                          {clockOut ? ` – ${clockOut}` : " (still clocked in)"}
                        </span>
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
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
