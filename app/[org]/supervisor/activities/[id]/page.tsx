import { createClient } from "@/lib/supabase/server"
import { getActivityById } from "@/lib/queries/activities"
import { getOrgJanitors } from "@/lib/queries/activities"
import { notFound } from "next/navigation"
import { ActivityDetail } from "./activity-detail"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"

export const metadata = {
  title: "Activity Detail - SpaceOps",
}

export default async function ActivityDetailPage({
  params,
}: {
  params: { org: string; id: string }
}) {
  const supabase = createClient()

  let activity
  let janitors
  try {
    ;[activity, janitors] = await Promise.all([
      getActivityById(supabase, params.id),
      getOrgJanitors(supabase),
    ])
  } catch {
    return notFound()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Activities", href: `/${params.org}/supervisor/activities` },
          { label: activity.name },
        ]}
      />
      <ActivityDetail
        activity={activity}
        janitors={janitors}
        orgSlug={params.org}
      />
    </div>
  )
}
