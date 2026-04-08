import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getJanitorAdhocTask } from "@/lib/queries/adhoc-tasks"
import { AdhocTaskView } from "./adhoc-task-view"

export const metadata = {
  title: "Task - SpaceOps",
}

export default async function AdhocTaskPage({
  params,
}: {
  params: { org: string; id: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const task = await getJanitorAdhocTask(supabase, params.id, user.id)
  if (!task) return notFound()

  return (
    <div className="space-y-4">
      <AdhocTaskView task={task} orgSlug={params.org} />
    </div>
  )
}
