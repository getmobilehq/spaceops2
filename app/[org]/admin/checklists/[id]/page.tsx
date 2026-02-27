import { createClient } from "@/lib/supabase/server"
import { getTemplateById } from "@/lib/queries/checklists"
import { getOrgRoomTypes } from "@/lib/queries/rooms"
import { notFound } from "next/navigation"
import { TemplateEditor } from "./template-editor"

export const metadata = {
  title: "Edit Template - SpaceOps",
}

export default async function TemplateDetailPage({
  params,
}: {
  params: { org: string; id: string }
}) {
  const supabase = createClient()

  let template
  let roomTypes
  try {
    ;[template, roomTypes] = await Promise.all([
      getTemplateById(supabase, params.id),
      getOrgRoomTypes(supabase),
    ])
  } catch {
    return notFound()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <TemplateEditor
        template={template}
        roomTypes={roomTypes}
        orgSlug={params.org}
      />
    </div>
  )
}
