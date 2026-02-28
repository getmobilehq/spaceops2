import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import {
  getRoomTaskForInspection,
  getEffectiveChecklist,
  getTaskItemResponses,
} from "@/lib/queries/task-responses"
import { InspectionView } from "./inspection-view"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"

export const metadata = {
  title: "Inspect Room - SpaceOps",
}

export default async function InspectTaskPage({
  params,
}: {
  params: { org: string; id: string; taskId: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const role = user.app_metadata?.role as string | undefined
  if (role !== "admin" && role !== "supervisor") return notFound()

  let task
  try {
    task = await getRoomTaskForInspection(supabase, params.taskId)
  } catch {
    return notFound()
  }

  // Only "done" tasks can be inspected
  if (task.status !== "done") return notFound()

  // Get checklist and responses
  const checklist = await getEffectiveChecklist(supabase, task.room_id)

  let responses: Awaited<ReturnType<typeof getTaskItemResponses>> = []
  try {
    responses = await getTaskItemResponses(supabase, params.taskId)
  } catch {
    responses = []
  }

  const activity = task.cleaning_activities as {
    id: string
    name: string
    status: string
  } | null
  const roomName =
    (task.rooms as { name?: string } | null)?.name || "Room"

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Breadcrumbs
        items={[
          {
            label: "Activities",
            href: `/${params.org}/supervisor/activities`,
          },
          {
            label: activity?.name || "Activity",
            href: `/${params.org}/supervisor/activities/${params.id}`,
          },
          { label: `Inspect: ${roomName}` },
        ]}
      />
      <InspectionView
        task={task}
        checklist={checklist}
        responses={responses}
        orgSlug={params.org}
        activityId={params.id}
      />
    </div>
  )
}
