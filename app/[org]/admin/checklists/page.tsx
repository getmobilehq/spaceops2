import { createClient } from "@/lib/supabase/server"
import { getOrgTemplates } from "@/lib/queries/checklists"
import { getOrgRoomTypes } from "@/lib/queries/rooms"
import { ChecklistLibrary } from "./checklist-library"

export const metadata = {
  title: "Checklists - SpaceOps",
}

export default async function ChecklistsPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const [templates, roomTypes] = await Promise.all([
    getOrgTemplates(supabase),
    getOrgRoomTypes(supabase),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand">Checklists</h1>
          <p className="text-muted-foreground">
            Manage cleaning checklist templates by room type.
          </p>
        </div>
      </div>
      <ChecklistLibrary
        templates={templates}
        roomTypes={roomTypes}
        orgSlug={params.org}
      />
    </div>
  )
}
