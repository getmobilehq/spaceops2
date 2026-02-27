import { createClient } from "@/lib/supabase/server"
import { getOrgRoomTypes } from "@/lib/queries/rooms"
import { TemplateForm } from "./template-form"

export const metadata = {
  title: "New Checklist Template - SpaceOps",
}

export default async function NewTemplatePage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const roomTypes = await getOrgRoomTypes(supabase)

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">New Template</h1>
        <p className="text-muted-foreground">
          Create a checklist template. You can add items after creating it.
        </p>
      </div>
      <TemplateForm roomTypes={roomTypes} orgSlug={params.org} />
    </div>
  )
}
