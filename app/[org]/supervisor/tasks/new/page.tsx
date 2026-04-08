import { createClient } from "@/lib/supabase/server"
import { getOrgJanitors } from "@/lib/queries/adhoc-tasks"
import { NewTaskForm } from "./new-task-form"

export const metadata = {
  title: "New Task - SpaceOps",
}

export default async function NewTaskPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const janitors = await getOrgJanitors(supabase)

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">New Task</h1>
        <p className="text-muted-foreground">
          Create a one-off task and assign it to a janitor
        </p>
      </div>
      <NewTaskForm orgSlug={params.org} janitors={janitors} />
    </div>
  )
}
