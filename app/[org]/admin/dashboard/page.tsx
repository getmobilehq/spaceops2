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
import { StatCard } from "@/components/shared/StatCard"
import { ACTIVITY_STATUS, ISSUE_STATUS, ISSUE_SEVERITY } from "@/lib/status-styles"

export const metadata = {
  title: "Admin Dashboard - SpaceOps",
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
        <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.user_metadata?.first_name || user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Buildings"
          value={stats.activeBuildings}
          icon={Building2}
          iconClassName="bg-primary/10 text-primary"
          animationDelay="0ms"
        />
        <StatCard
          title="Open Issues"
          value={stats.openDeficiencies}
          icon={AlertTriangle}
          iconClassName={
            stats.openDeficiencies > 0
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
          }
          animationDelay="100ms"
        />
        <StatCard
          title="Activities This Week"
          value={stats.activitiesThisWeek}
          icon={CalendarCheck}
          iconClassName="bg-success/10 text-success"
          animationDelay="200ms"
        />
        <StatCard
          title="Avg Pass Rate"
          value={stats.avgPassRate !== null ? `${stats.avgPassRate}%` : "N/A"}
          icon={TrendingUp}
          iconClassName="bg-info/10 text-info"
          animationDelay="300ms"
        />
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
              {events.map((event, i) => {
                const statusMap = event.type === "activity" ? ACTIVITY_STATUS : ISSUE_STATUS
                const sb = statusMap[event.status] || ACTIVITY_STATUS.draft
                const svb = event.severity
                  ? ISSUE_SEVERITY[event.severity]
                  : null

                return (
                  <div
                    key={`${event.type}-${event.id}`}
                    className="flex items-center justify-between rounded-md border p-3 animate-fade-in-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase text-muted-foreground">
                          {event.type === "activity" ? "Activity" : "Issue"}
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
