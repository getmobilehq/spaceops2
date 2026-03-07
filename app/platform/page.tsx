import { getPlatformStats, getAllOrgs } from "@/lib/queries/platform"
import { getPlatformUsageStats } from "@/lib/queries/usage"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, CreditCard, BarChart3, Cpu, Code } from "lucide-react"

export default async function PlatformDashboard() {
  const [stats, orgs, usage] = await Promise.all([
    getPlatformStats(),
    getAllOrgs(),
    getPlatformUsageStats(),
  ])

  const recentOrgs = orgs.slice(0, 5)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Platform Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Organisations
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrgs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Subscriptions
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeSubscriptions}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Plan Distribution
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge variant="secondary">
                Free: {stats.planDistribution.free}
              </Badge>
              <Badge>Pro: {stats.planDistribution.pro}</Badge>
              <Badge variant="outline">
                Ent: {stats.planDistribution.enterprise}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              AI Calls This Month
            </CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.totalAiCalls}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              API Calls This Month
            </CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.totalApiCalls}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Organisations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Organisations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentOrgs.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between rounded-md border px-4 py-3"
              >
                <div>
                  <p className="font-medium">{org.name}</p>
                  <p className="text-sm text-muted-foreground">{org.slug}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={org.plan === "free" ? "secondary" : "default"}
                    className="capitalize"
                  >
                    {org.plan}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(org.created_at).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>
            ))}
            {recentOrgs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No organisations yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
