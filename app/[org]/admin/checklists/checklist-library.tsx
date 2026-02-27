"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Plus, ClipboardCheck } from "lucide-react"

interface TemplateData {
  id: string
  name: string
  is_default: boolean
  room_type_id: string | null
  room_types: { name: string } | null
  checklist_items: { id: string }[]
}

interface RoomTypeOption {
  id: string
  name: string
}

export function ChecklistLibrary({
  templates,
  roomTypes,
  orgSlug,
}: {
  templates: TemplateData[]
  roomTypes: RoomTypeOption[]
  orgSlug: string
}) {
  // Group templates by room type
  const grouped = new Map<string | null, TemplateData[]>()

  for (const tpl of templates) {
    const key = tpl.room_type_id
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(tpl)
  }

  // Sort room types, put "General" (null) last
  const sortedKeys: (string | null)[] = []
  for (const rt of roomTypes) {
    if (grouped.has(rt.id)) sortedKeys.push(rt.id)
  }
  if (grouped.has(null)) sortedKeys.push(null)

  const roomTypeMap = new Map(roomTypes.map((rt) => [rt.id, rt.name]))

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button asChild>
          <Link href={`/${orgSlug}/admin/checklists/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Link>
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              No checklist templates yet. Create one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        sortedKeys.map((key) => {
          const group = grouped.get(key) || []
          const typeName = key ? roomTypeMap.get(key) || "Unknown" : "General"
          return (
            <div key={key || "general"}>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {typeName}
              </h2>
              <div className="space-y-2">
                {group.map((tpl) => (
                  <Link
                    key={tpl.id}
                    href={`/${orgSlug}/admin/checklists/${tpl.id}`}
                    className="flex items-center justify-between rounded-md border p-4 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{tpl.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tpl.checklist_items.length} item
                          {tpl.checklist_items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {tpl.is_default && (
                        <Badge
                          variant="outline"
                          className="border-green-200 bg-green-50 text-green-700"
                        >
                          Default
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
