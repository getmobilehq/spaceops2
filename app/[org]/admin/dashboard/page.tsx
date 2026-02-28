import { createClient } from "@/lib/supabase/server"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  AlertTriangle,
  CalendarCheck,
  TrendingUp,
} from "lucide-react"
import {
  getAdminDashboardStats,
  getRecentActivity,
} from "@/lib/queries/dashboard"

export const metadata = {
  title: "Admin Dashboard - SpaceOps",
}

const statusBadge: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "border-gray-200 bg-gray-50 text-gray-700" },
  active: { label: "Active", className: "border-green-200 bg-green-50 text-green-700" },
  closed: { label: "Closed", className: "border-blue-200 bg-blue-50 text-blue-700" },
  cancelled: { label: "Cancelled", className: "border-red-200 bg-red-50 text-red-700" },
  open: { label: "Open", className: "border-red-200 bg-red-50 text-red-700" },
  in_progress: { label: "In Progress", className: "border-yellow-200 bg-yellow-50 text-yellow-700" },
  resolved: { label: "Resolved", className: "border-green-200 bg-green-50 text-green-700" },
}

const severityBadge: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "border-blue-200 bg-blue-50 text-blue-700" },
  medium: { label: "Medium", className: "border-yellow-200 bg-yellow-50 text-yellow-700" },
  high: { label: "High", className: "border-red-200 bg-red-50 text-red-700" },
}

export default async function AdminDashboardPage() {
  const supabase = createClient()
  const [{ data: { user } }, stats, events] = await Promise.all([
    supabase.auth.getUser(),
    getAdminDashboardStats(supabase),
    getRecentActivity(supabase),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.user_metadata?.first_name || user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Buildings</p>
                <p className="text-3xl font-bold text-brand">
                  {stats.activeBuildings}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Deficiencies</p>
                <p className={`text-3xl font-bold ${stats.openDeficiencies > 0 ? "text-red-600" : "text-brand"}`}>
                  {stats.openDeficiencies}
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${stats.openDeficiencies > 0 ? "text-red-200" : "text-muted-foreground/50"}`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activities This Week</p>
                <p className="text-3xl font-bold text-brand">
                  {stats.activitiesThisWeek}
                </p>
              </div>
              <CalendarCheck className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Pass Rate</p>
                <p className="text-3xl font-bold text-brand">
                  {stats.avgPassRate !== null ? `${stats.avgPassRate}%` : "N/A"}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No activity yet. Start by creating a building.
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
                const sb = statusBadge[event.status] || statusBadge.draft
                const svb = event.severity
                  ? severityBadge[event.severity]
                  : null

                return (
                  <div
                    key={`${event.type}-${event.id}`}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase text-muted-foreground">
                          {event.type === "activity" ? "Activity" : "Deficiency"}
                        </span>
                        {svb && (
                          <Badge variant="outline" className={svb.className}>
                            {svb.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.subtitle}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className={sb.className}>
                        {sb.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
