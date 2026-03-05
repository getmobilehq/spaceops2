"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import {
  updateActivityTemplate,
  deleteActivityTemplate,
  toggleRecurringActive,
  generateRecurringActivities,
} from "@/actions/activity-templates"
import { Clock, MapPin, Pencil, Trash2, Play, RefreshCw, Pause, Zap } from "lucide-react"

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

interface DefaultAssignment {
  room_id: string
  assigned_to: string
}

interface JanitorOption {
  id: string
  first_name: string
  last_name: string
}

interface TimeSlot {
  window_start: string
  window_end: string
  label?: string
}

interface TemplateData {
  id: string
  name: string
  floor_id: string
  window_start: string
  window_end: string
  notes: string | null
  default_assignments: unknown
  is_recurring: boolean
  is_active: boolean
  recurrence_days: string[]
  time_slots: unknown
  recurrence_preset: string | null
  last_generated_date: string | null
  created_at: string
  floors: {
    id: string
    floor_name: string
    building_id: string
    buildings: { id: string; name: string } | null
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

export function TemplateDetail({
  template,
  janitors,
  roomMap,
  orgSlug,
}: {
  template: TemplateData
  janitors: JanitorOption[]
  roomMap: Record<string, string>
  orgSlug: string
}) {
  const router = useRouter()
  const { toast } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(template.name)
  const [editWindowStart, setEditWindowStart] = useState(
    template.window_start.slice(0, 5)
  )
  const [editWindowEnd, setEditWindowEnd] = useState(
    template.window_end.slice(0, 5)
  )
  const [editNotes, setEditNotes] = useState(template.notes || "")
  const [isSaving, setIsSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const assignments = Array.isArray(template.default_assignments)
    ? (template.default_assignments as DefaultAssignment[])
    : []

  const timeSlots: TimeSlot[] = Array.isArray(template.time_slots)
    ? (template.time_slots as TimeSlot[])
    : []

  const janitorMap = new Map(
    janitors.map((j) => [j.id, `${j.first_name} ${j.last_name}`])
  )

  async function handleSave() {
    setIsSaving(true)
    const result = await updateActivityTemplate({
      templateId: template.id,
      name: editName,
      windowStart: editWindowStart,
      windowEnd: editWindowEnd,
      notes: editNotes || null,
    })
    if (result.success) {
      toast({ title: "Template updated" })
      setIsEditing(false)
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsSaving(false)
  }

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteActivityTemplate({ templateId: template.id })
    if (result.success) {
      toast({ title: "Template deleted" })
      router.push(`/${orgSlug}/supervisor/templates`)
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsDeleting(false)
    setConfirmDelete(false)
  }

  async function handleToggleActive() {
    setIsToggling(true)
    const result = await toggleRecurringActive({
      templateId: template.id,
      isActive: !template.is_active,
    })
    if (result.success) {
      toast({
        title: template.is_active ? "Schedule paused" : "Schedule resumed",
      })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsToggling(false)
  }

  async function handleGenerateNow() {
    setIsGenerating(true)
    const result = await generateRecurringActivities({
      templateId: template.id,
    })
    if (result.success) {
      toast({ title: "Activities generated" })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsGenerating(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle>{template.name}</CardTitle>
                {template.is_recurring && (
                  <Badge
                    variant="outline"
                    className={
                      template.is_active
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-muted-foreground/30 bg-muted text-muted-foreground"
                    }
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {template.is_active ? "Recurring" : "Paused"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {template.floors?.buildings?.name} · {template.floors?.floor_name}
                </span>
                {!template.is_recurring && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {template.window_start.slice(0, 5)} – {template.window_end.slice(0, 5)}
                  </span>
                )}
              </div>
              {template.notes && (
                <p className="text-sm text-muted-foreground mt-1">
                  {template.notes}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Created by {template.users?.first_name} {template.users?.last_name}
              </p>
            </div>
            <div className="flex gap-2">
              {!template.is_recurring && (
                <Button size="sm" asChild>
                  <Link
                    href={`/${orgSlug}/supervisor/activities/new?templateId=${template.id}`}
                  >
                    <Play className="mr-1 h-3.5 w-3.5" />
                    Use Template
                  </Link>
                </Button>
              )}
              {template.is_recurring && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleToggleActive}
                    disabled={isToggling}
                  >
                    {template.is_active ? (
                      <Pause className="mr-1 h-3.5 w-3.5" />
                    ) : (
                      <Play className="mr-1 h-3.5 w-3.5" />
                    )}
                    {template.is_active ? "Pause" : "Resume"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleGenerateNow}
                    disabled={isGenerating}
                  >
                    <Zap className="mr-1 h-3.5 w-3.5" />
                    {isGenerating ? "Generating..." : "Generate Now"}
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Recurring schedule details */}
      {template.is_recurring && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recurring Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Frequency */}
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{getFrequencyLabel(template)}</span>
            </div>

            {/* Days */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Days</p>
              <div className="flex gap-1.5">
                {DAY_ORDER.map((d) => (
                  <span
                    key={d}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                      template.recurrence_days.includes(d)
                        ? "bg-primary/15 text-primary"
                        : "border border-border text-muted-foreground/40"
                    }`}
                  >
                    {DAY_LABELS[d]}
                  </span>
                ))}
              </div>
            </div>

            {/* Time slots */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Time Slots</p>
              <div className="space-y-2">
                {timeSlots.map((slot, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-md border p-3 text-sm"
                  >
                    {slot.label && (
                      <span className="font-medium text-muted-foreground w-20">
                        {slot.label}
                      </span>
                    )}
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {slot.window_start.slice(0, 5)} – {slot.window_end.slice(0, 5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last generated */}
            {template.last_generated_date && (
              <p className="text-xs text-muted-foreground">
                Last generated: {template.last_generated_date}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Default assignments */}
      {assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Default Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {assignments.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <span className="text-sm font-medium">
                  {roomMap[a.room_id] || "Unknown room"}
                </span>
                <span>{janitorMap.get(a.assigned_to) || "Unknown janitor"}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Edit dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            {!template.is_recurring && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={editWindowStart}
                    onChange={(e) => setEditWindowStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={editWindowEnd}
                    onChange={(e) => setEditWindowEnd(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !editName}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{template.name}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
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
    </>
  )
}
