import { notFound } from "next/navigation"
import Link from "next/link"
import { getOrgWithCounts, getOrgAuditLog } from "@/lib/queries/platform"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { OrgManagement } from "./org-management"

export default async function PlatformOrgDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [{ org, users, buildingCount, subscription }, auditLog] =
    await Promise.all([
      getOrgWithCounts(params.id),
      getOrgAuditLog(params.id),
    ])

  if (!org) return notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/platform/orgs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{org.name}</h1>
          <p className="text-muted-foreground">{org.slug}</p>
        </div>
        <Badge
          variant={org.plan === "free" ? "secondary" : "default"}
          className="capitalize ml-2"
        >
          {org.plan}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Buildings</span>
              <span className="font-medium">{buildingCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Users</span>
              <span className="font-medium">{users.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stripe Customer</span>
              <span className="font-medium font-mono text-xs">
                {org.stripe_customer_id || "Not connected"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">
                {new Date(org.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {subscription ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={
                      subscription.status === "active"
                        ? "default"
                        : "secondary"
                    }
                    className="capitalize"
                  >
                    {subscription.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period End</span>
                  <span className="font-medium">
                    {new Date(
                      subscription.current_period_end
                    ).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Cancel at Period End
                  </span>
                  <span className="font-medium">
                    {subscription.cancel_at_period_end ? "Yes" : "No"}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No active subscription</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Org Management */}
      <OrgManagement
        orgId={org.id}
        orgName={org.name}
        currentPlan={org.plan as "free" | "pro" | "enterprise"}
        suspendedAt={org.suspended_at}
        suspendedReason={org.suspended_reason}
      />

      {/* Audit Log */}
      {auditLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Audit Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditLog.map((entry) => {
                const performer = entry.users as {
                  first_name: string
                  last_name: string
                } | null
                const performerName = performer
                  ? `${performer.first_name} ${performer.last_name}`
                  : "Unknown"
                let label = ""
                switch (entry.action_type) {
                  case "plan_change":
                    label = `Plan changed from ${entry.from_value} to ${entry.to_value}`
                    break
                  case "suspend":
                    label = "Organisation suspended"
                    break
                  case "unsuspend":
                    label = "Organisation reactivated"
                    break
                  case "delete":
                    label = "Organisation deleted"
                    break
                  default:
                    label = entry.action_type
                }
                return (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between rounded-md border p-3"
                  >
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium">{label}</p>
                      {entry.note && (
                        <p className="text-xs text-muted-foreground">
                          {entry.note}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        by {performerName}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">
                      {u.first_name} {u.last_name}
                    </td>
                    <td className="py-3">
                      <Badge variant="secondary" className="capitalize">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={u.is_active ? "default" : "destructive"}
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
