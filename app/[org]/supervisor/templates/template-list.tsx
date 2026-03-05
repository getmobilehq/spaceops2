"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  deleteActivityTemplate,
  toggleRecurringActive,
} from "@/actions/activity-templates"
import { Plus, Clock, MapPin, Trash2, RefreshCw, Pause, Play } from "lucide-react"

const DAY_LABELS: Record<string, string> = {
  monday: "M",
  tuesday: "T",
  wednesday: "W",
  thursday: "T",
  friday: "F",
  saturday: "S",
  sunday: "S",
}

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

interface TemplateData {
  id: string
  name: string
  window_start: string
  window_end: string
  notes: string | null
  default_assignments: unknown
  is_recurring: boolean
  is_active: boolean
  recurrence_days: string[]
  time_slots: unknown
  recurrence_preset: string | null
  created_at: string
  floors: {
    floor_name: string
    building_id: string
    buildings: { name: string } | null
  } | null
  users: { first_name: string; last_name: string } | null
}

function getFrequencyLabel(template: TemplateData): string {
  const slots = Array.isArray(template.time_slots) ? template.time_slots : []
  if (slots.length === 1) return "1x daily"
  if (slots.length === 2) return "2x daily"
  if (slots.length === 3) return "3x daily"
  return `${slots.length}x daily`
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
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const recurring = templates.filter((t) => t.is_recurring)
  const quick = templates.filter((t) => !t.is_recurring)

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

  async function handleToggleActive(templateId: string, currentlyActive: boolean) {
    setTogglingId(templateId)
    const result = await toggleRecurringActive({
      templateId,
      isActive: !currentlyActive,
    })
    if (result.success) {
      toast({
        title: currentlyActive ? "Schedule paused" : "Schedule resumed",
      })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setTogglingId(null)
  }

  function renderTemplateRow(t: TemplateData) {
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
          <div className="flex items-center gap-2">
            <p className="font-medium">{t.name}</p>
            {t.is_recurring && (
              <Badge
                variant="outline"
                className={
                  t.is_active
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-muted-foreground/30 bg-muted text-muted-foreground"
                }
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {t.is_active ? "Recurring" : "Paused"}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {t.floors?.buildings?.name} · {t.floors?.floor_name}
            </span>
            {t.is_recurring ? (
              <>
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  {getFrequencyLabel(t)}
                </span>
                <span className="flex gap-0.5">
                  {DAY_ORDER.map((d) => (
                    <span
                      key={d}
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                        t.recurrence_days.includes(d)
                          ? "bg-primary/15 text-primary font-medium"
                          : "text-muted-foreground/40"
                      }`}
                    >
                      {DAY_LABELS[d]}
                    </span>
                  ))}
                </span>
              </>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t.window_start.slice(0, 5)} – {t.window_end.slice(0, 5)}
              </span>
            )}
            {assignmentCount > 0 && (
              <span>
                {assignmentCount} default assignment
                {assignmentCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {t.is_recurring && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleToggleActive(t.id, t.is_active)}
              disabled={togglingId === t.id}
            >
              {t.is_active ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          {!t.is_recurring && (
            <Button size="sm" asChild>
              <Link
                href={`/${orgSlug}/supervisor/activities/new?templateId=${t.id}`}
              >
                Use
              </Link>
            </Button>
          )}
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
        <div className="space-y-6">
          {recurring.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Recurring Schedules
              </h3>
              {recurring.map(renderTemplateRow)}
            </div>
          )}
          {quick.length > 0 && (
            <div className="space-y-2">
              {recurring.length > 0 && (
                <h3 className="text-sm font-medium text-muted-foreground">
                  Quick Templates
                </h3>
              )}
              {quick.map(renderTemplateRow)}
            </div>
          )}
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
