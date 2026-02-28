import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import {
  getRoomTaskDetail,
  getEffectiveChecklist,
  getTaskItemResponses,
} from "@/lib/queries/task-responses"
import { TaskExecutionView } from "./task-execution-view"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"

export const metadata = {
  title: "Room Task - SpaceOps",
}

export default async function TaskDetailPage({
  params,
}: {
  params: { org: string; taskId: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  let task
  try {
    task = await getRoomTaskDetail(supabase, params.taskId)
  } catch {
    return notFound()
  }

  // Verify assigned to current user
  if (task.assigned_to !== user.id) return notFound()

  // Verify activity is active
  const activity = task.cleaning_activities as {
    name: string
    status: string
    scheduled_date: string
    window_start: string
    window_end: string
    floors: { floor_name: string; buildings: { name: string } | null } | null
  } | null

  if (!activity || activity.status !== "active") return notFound()

  // Get effective checklist for this room
  const checklist = await getEffectiveChecklist(supabase, task.room_id)

  // Get existing responses
  let responses: Awaited<ReturnType<typeof getTaskItemResponses>> = []
  try {
    responses = await getTaskItemResponses(supabase, params.taskId)
  } catch {
    responses = []
  }

  const roomName = (task.rooms as { name?: string } | null)?.name || "Room Task"

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[
          { label: "Today", href: `/${params.org}/janitor/today` },
          { label: roomName },
        ]}
      />
      <TaskExecutionView
        task={task}
        checklist={checklist}
        existingResponses={responses}
        orgSlug={params.org}
      />
    </div>
  )
}
