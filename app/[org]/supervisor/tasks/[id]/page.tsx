import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { TaskDetail } from "./task-detail"

export const metadata = {
  title: "Task Detail - SpaceOps",
}

export default async function TaskDetailPage({
  params,
}: {
  params: { org: string; id: string }
}) {
  const supabase = createClient()

  const { data: task, error } = await supabase
    .from("adhoc_tasks")
    .select(
      "*, assigned:users!adhoc_tasks_assigned_to_fkey(id, first_name, last_name), creator:users!adhoc_tasks_created_by_fkey(id, first_name, last_name)"
    )
    .eq("id", params.id)
    .single()

  if (error || !task) return notFound()

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <TaskDetail task={task} orgSlug={params.org} />
    </div>
  )
}
