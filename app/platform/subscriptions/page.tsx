import { getAllSubscriptions } from "@/lib/queries/platform"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function PlatformSubscriptionsPage() {
  const subscriptions = await getAllSubscriptions()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Subscriptions</h1>

      <Card>
        <CardHeader>
          <CardTitle>
            {subscriptions.length} subscription
            {subscriptions.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Organisation</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Period End</th>
                  <th className="pb-3 font-medium">Cancel</th>
                  <th className="pb-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">
                      {(sub.organisations as { name: string } | null)?.name ||
                        "Unknown"}
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          sub.status === "active" ? "default" : "secondary"
                        }
                        className="capitalize"
                      >
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(
                        sub.current_period_end
                      ).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {sub.cancel_at_period_end ? "Yes" : "No"}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(sub.created_at).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))}
                {subscriptions.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No subscriptions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
