"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { deleteActivityTemplate } from "@/actions/activity-templates"
import { Plus, Clock, MapPin, Trash2 } from "lucide-react"

interface TemplateData {
  id: string
  name: string
  window_start: string
  window_end: string
  notes: string | null
  default_assignments: unknown
  created_at: string
  floors: {
    floor_name: string
    building_id: string
    buildings: { name: string } | null
  } | null
  users: { first_name: string; last_name: string } | null
}

export function TemplateList({
  templates,
  orgSlug,
}: {
  templates: TemplateData[]
  orgSlug: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    const result = await deleteActivityTemplate({ templateId: deleteId })
    if (result.success) {
      toast({ title: "Template deleted" })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsDeleting(false)
    setDeleteId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button asChild>
          <Link href={`/${orgSlug}/supervisor/templates/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Link>
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No templates yet. Create one to save reusable activity configurations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => {
            const assignmentCount = Array.isArray(t.default_assignments)
              ? t.default_assignments.length
              : 0

            return (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-md border p-4 hover:bg-muted transition-colors"
              >
                <Link
                  href={`/${orgSlug}/supervisor/templates/${t.id}`}
                  className="flex-1 space-y-1"
                >
                  <p className="font-medium">{t.name}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {t.floors?.buildings?.name} · {t.floors?.floor_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t.window_start.slice(0, 5)} – {t.window_end.slice(0, 5)}
                    </span>
                    {assignmentCount > 0 && (
                      <span>
                        {assignmentCount} default assignment{assignmentCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Button size="sm" asChild>
                    <Link
                      href={`/${orgSlug}/supervisor/activities/new?templateId=${t.id}`}
                    >
                      Use
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteId(t.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
