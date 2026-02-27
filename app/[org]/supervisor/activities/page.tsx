import { createClient } from "@/lib/supabase/server"
import { getSupervisorActivities } from "@/lib/queries/activities"
import { ActivityList } from "./activity-list"

export const metadata = {
  title: "Activities - SpaceOps",
}

export default async function ActivitiesPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const activities = await getSupervisorActivities(supabase)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Activities</h1>
        <p className="text-muted-foreground">
          Create and manage cleaning activities
        </p>
      </div>
      <ActivityList activities={activities} orgSlug={params.org} />
    </div>
  )
}
