import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SignOutButton } from "@/components/shared/SignOutButton"
import {
  getSupervisorActivities,
  getSupervisorBuildings,
} from "@/lib/queries/activities"

export const metadata = {
  title: "Supervisor Dashboard - SpaceOps",
}

export default async function SupervisorDashboardPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const today = new Date().toISOString().split("T")[0]

  const [todayActivities, buildings] = await Promise.all([
    getSupervisorActivities(supabase, { date: today }),
    user ? getSupervisorBuildings(supabase, user.id) : [],
  ])

  const activeCount = todayActivities.filter(
    (a) => a.status === "active" || a.status === "draft"
  ).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand">
            Supervisor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome, {user?.user_metadata?.first_name || user?.email}
          </p>
        </div>
        <SignOutButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href={`/${params.org}/supervisor/activities`}>
          <Card className="hover:bg-muted transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today&apos;s Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-brand">{activeCount}</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rooms Pending Inspection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand">--</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand">--</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assigned Buildings</CardTitle>
        </CardHeader>
        <CardContent>
          {buildings.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No buildings assigned yet. Buildings will be assigned by your admin.
            </p>
          ) : (
            <div className="space-y-2">
              {buildings.map((b) =>
                b ? (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.address}
                      </p>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
