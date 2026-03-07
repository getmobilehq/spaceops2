import { getPlatformUsageStats, getPlatformUsageByOrg } from "@/lib/queries/usage"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cpu, Code, Activity } from "lucide-react"

export default async function PlatformUsagePage() {
  const [stats, orgUsage] = await Promise.all([
    getPlatformUsageStats(),
    getPlatformUsageByOrg(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Usage Analytics</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Events This Month
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              AI Calls
            </CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAiCalls}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Vectorisations + AI Reports
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              API Calls
            </CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApiCalls}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Public API requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-Org Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Organisation</CardTitle>
        </CardHeader>
        <CardContent>
          {orgUsage.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No usage events this month.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Organisation</th>
                    <th className="pb-2 font-medium">Plan</th>
                    <th className="pb-2 font-medium text-right">AI Calls</th>
                    <th className="pb-2 font-medium text-right">API Calls</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orgUsage.map((org) => (
                    <tr key={org.orgId} className="border-b last:border-0">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {org.slug}
                          </p>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            org.plan === "enterprise"
                              ? "default"
                              : org.plan === "pro"
                                ? "default"
                                : "secondary"
                          }
                          className="capitalize"
                        >
                          {org.plan}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">{org.aiCalls}</td>
                      <td className="py-3 text-right">{org.apiCalls}</td>
                      <td className="py-3 text-right font-medium">
                        {org.aiCalls + org.apiCalls}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
