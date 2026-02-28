"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
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
} from "@/actions/activity-templates"
import { Clock, MapPin, Pencil, Trash2, Play } from "lucide-react"

interface DefaultAssignment {
  room_id: string
  assigned_to: string
}

interface JanitorOption {
  id: string
  first_name: string
  last_name: string
}

interface TemplateData {
  id: string
  name: string
  floor_id: string
  window_start: string
  window_end: string
  notes: string | null
  default_assignments: unknown
  created_at: string
  floors: {
    id: string
    floor_name: string
    building_id: string
    buildings: { id: string; name: string } | null
  } | null
  users: { first_name: string; last_name: string } | null
}

export function TemplateDetail({
  template,
  janitors,
  orgSlug,
}: {
  template: TemplateData
  janitors: JanitorOption[]
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

  const assignments = Array.isArray(template.default_assignments)
    ? (template.default_assignments as DefaultAssignment[])
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>{template.name}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {template.floors?.buildings?.name} · {template.floors?.floor_name}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {template.window_start.slice(0, 5)} – {template.window_end.slice(0, 5)}
                </span>
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
              <Button size="sm" asChild>
                <Link
                  href={`/${orgSlug}/supervisor/activities/new?templateId=${template.id}`}
                >
                  <Play className="mr-1 h-3.5 w-3.5" />
                  Use Template
                </Link>
              </Button>
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
                <span className="font-mono text-xs text-muted-foreground">
                  {a.room_id.slice(0, 8)}...
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
