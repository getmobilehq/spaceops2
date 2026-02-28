import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getClientRecentActivities } from "@/lib/queries/client-dashboard"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { CalendarDays, CheckCircle2, XCircle } from "lucide-react"

export const metadata = {
  title: "Activities - SpaceOps",
}

const statusBadge: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "border-green-200 bg-green-50 text-green-700" },
  closed: { label: "Completed", className: "border-blue-200 bg-blue-50 text-blue-700" },
}

export default async function ClientActivitiesPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()
  const role = user.app_metadata?.role as string | undefined
  if (role !== "client") return notFound()

  const activities = await getClientRecentActivities(supabase, 50)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Activities</h1>
        <p className="text-muted-foreground">
          Cleaning activity history for your buildings
        </p>
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No activities yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activities.map((a) => {
            const sb = statusBadge[a.status] || statusBadge.active
            const inspected = a.passedRooms + a.failedRooms
            const progressPct =
              a.totalRooms > 0
                ? Math.round((a.completedRooms / a.totalRooms) * 100)
                : 0
            const passedPct =
              a.totalRooms > 0
                ? Math.round((a.passedRooms / a.totalRooms) * 100)
                : 0
            const failedPct =
              a.totalRooms > 0
                ? Math.round((a.failedRooms / a.totalRooms) * 100)
                : 0

            return (
              <Card key={a.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.buildingName} · {a.floorName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(a.scheduledDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                      <Badge variant="outline" className={sb.className}>
                        {sb.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                      {passedPct > 0 && (
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${passedPct}%` }}
                        />
                      )}
                      {failedPct > 0 && (
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${failedPct}%` }}
                        />
                      )}
                      {progressPct - passedPct - failedPct > 0 && (
                        <div
                          className="h-full bg-yellow-400"
                          style={{
                            width: `${progressPct - passedPct - failedPct}%`,
                          }}
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{a.completedRooms}/{a.totalRooms} rooms</span>
                      <div className="flex items-center gap-3">
                        {a.passedRooms > 0 && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            {a.passedRooms}
                          </span>
                        )}
                        {a.failedRooms > 0 && (
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-3 w-3" />
                            {a.failedRooms}
                          </span>
                        )}
                        {a.passRate !== null && (
                          <span
                            className={
                              a.passRate >= 80
                                ? "font-medium text-green-600"
                                : a.passRate >= 50
                                ? "font-medium text-yellow-600"
                                : "font-medium text-red-600"
                            }
                          >
                            {a.passRate}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
