import Link from "next/link"
import { getAllOrgs } from "@/lib/queries/platform"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function PlatformOrgsPage() {
  const orgs = await getAllOrgs()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">All Organisations</h1>

      <Card>
        <CardHeader>
          <CardTitle>
            {orgs.length} organisation{orgs.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Slug</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Stripe</th>
                  <th className="pb-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr key={org.id} className="border-b last:border-0">
                    <td className="py-3">
                      <Link
                        href={`/platform/orgs/${org.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {org.name}
                      </Link>
                    </td>
                    <td className="py-3 text-muted-foreground">{org.slug}</td>
                    <td className="py-3">
                      <Badge
                        variant={
                          org.plan === "free" ? "secondary" : "default"
                        }
                        className="capitalize"
                      >
                        {org.plan}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {org.stripe_customer_id ? "Connected" : "None"}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString("en-GB")}
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
