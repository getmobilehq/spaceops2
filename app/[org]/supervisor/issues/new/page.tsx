import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { getRoomTaskForInspection } from "@/lib/queries/task-responses"
import { getOrgJanitors } from "@/lib/queries/activities"
import { NewDeficiencyForm } from "./new-deficiency-form"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"

export const metadata = {
  title: "Report Issue - SpaceOps",
}

export default async function NewDeficiencyPage({
  params,
  searchParams,
}: {
  params: { org: string }
  searchParams: { taskId?: string; activityId?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const role = user.app_metadata?.role as string | undefined
  if (role !== "admin" && role !== "supervisor") return notFound()

  if (!searchParams.taskId) {
    return redirect(`/${params.org}/supervisor/issues`)
  }

  let task
  try {
    task = await getRoomTaskForInspection(supabase, searchParams.taskId)
  } catch {
    return notFound()
  }

  const janitors = await getOrgJanitors(supabase)

  const roomName =
    (task.rooms as { name?: string } | null)?.name || "Room"

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Breadcrumbs
        items={[
          {
            label: "Issues",
            href: `/${params.org}/supervisor/issues`,
          },
          { label: `Report: ${roomName}` },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-brand">Report Issues</h1>
        <p className="text-muted-foreground">
          Add issues found during inspection of {roomName}
        </p>
      </div>
      <NewDeficiencyForm
        taskId={searchParams.taskId}
        activityId={searchParams.activityId || ""}
        roomName={roomName}
        janitors={janitors}
        orgSlug={params.org}
      />
    </div>
  )
}
