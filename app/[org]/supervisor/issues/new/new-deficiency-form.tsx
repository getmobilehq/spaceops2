"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createDeficiencyWithPhoto } from "@/actions/deficiencies"
import { Plus, Trash2, AlertTriangle, Camera, X } from "lucide-react"

interface JanitorOption {
  id: string
  first_name: string
  last_name: string
}

interface DeficiencyEntry {
  id: string
  description: string
  severity: "low" | "medium" | "high"
  assignedTo: string | null
  photo: File | null
  photoPreview: string | null
}

export function NewDeficiencyForm({
  taskId,
  activityId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  roomName: _roomName,
  janitors,
  orgSlug,
}: {
  taskId: string
  activityId: string
  roomName: string
  janitors: JanitorOption[]
  orgSlug: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const [entries, setEntries] = useState<DeficiencyEntry[]>([
    {
      id: crypto.randomUUID(),
      description: "",
      severity: "medium",
      assignedTo: null,
      photo: null,
      photoPreview: null,
    },
  ])

  function addEntry() {
    setEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: "",
        severity: "medium",
        assignedTo: null,
        photo: null,
        photoPreview: null,
      },
    ])
  }

  function removeEntry(id: string) {
    if (entries.length <= 1) return
    setEntries((prev) => prev.filter((e) => e.id !== id))
    fileInputRefs.current.delete(id)
  }

  function updateEntry(
    id: string,
    field: "description" | "severity" | "assignedTo",
    value: string | null
  ) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    )
  }

  function handlePhotoChange(entryId: string, file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? { ...e, photo: file, photoPreview: reader.result as string }
            : e
        )
      )
    }
    reader.readAsDataURL(file)
  }

  function removePhoto(entryId: string) {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId ? { ...e, photo: null, photoPreview: null } : e
      )
    )
    const input = fileInputRefs.current.get(entryId)
    if (input) input.value = ""
  }

  async function handleSubmit() {
    // Validate descriptions
    const hasDescriptions = entries.every((e) => e.description.trim().length > 0)
    if (!hasDescriptions) {
      toast({
        title: "Error",
        description: "All issues must have a description",
        variant: "destructive",
      })
      return
    }

    // Validate photos
    const hasPhotos = entries.every((e) => e.photo !== null)
    if (!hasPhotos) {
      toast({
        title: "Error",
        description: "All issues must have a photo",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const results = await Promise.all(
      entries.map((e) => {
        const formData = new FormData()
        formData.append("roomTaskId", taskId)
        formData.append("description", e.description.trim())
        formData.append("severity", e.severity)
        if (e.assignedTo) formData.append("assignedTo", e.assignedTo)
        if (e.photo) formData.append("photo", e.photo)
        return createDeficiencyWithPhoto(formData)
      })
    )

    const failed = results.filter((r) => !r.success)
    if (failed.length > 0) {
      toast({
        title: "Error",
        description: `${failed.length} issues failed to create`,
        variant: "destructive",
      })
    } else {
      toast({
        title: `${entries.length} issue${entries.length === 1 ? "" : "s"} reported`,
      })
      if (activityId) {
        router.push(`/${orgSlug}/supervisor/activities/${activityId}`)
      } else {
        router.push(`/${orgSlug}/supervisor/issues`)
      }
      router.refresh()
    }
    setIsSubmitting(false)
  }

  function handleSkip() {
    if (activityId) {
      router.push(`/${orgSlug}/supervisor/activities/${activityId}`)
    } else {
      router.push(`/${orgSlug}/supervisor/issues`)
    }
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, idx) => (
        <Card key={entry.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Issue #{idx + 1}
              </CardTitle>
              {entries.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeEntry(entry.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Photo (required)
              </label>
              <div className="mt-1">
                {entry.photoPreview ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.photoPreview}
                      alt="Issue photo"
                      className="h-28 w-28 rounded-md object-cover border"
                    />
                    <button
                      type="button"
                      className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white text-xs"
                      onClick={() => removePhoto(entry.id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      fileInputRefs.current.get(entry.id)?.click()
                    }
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Take Photo
                  </Button>
                )}
                <input
                  ref={(el) => {
                    if (el) fileInputRefs.current.set(entry.id, el)
                  }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handlePhotoChange(entry.id, file)
                  }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Description
              </label>
              <textarea
                value={entry.description}
                onChange={(e) =>
                  updateEntry(entry.id, "description", e.target.value)
                }
                placeholder="Describe the issue..."
                rows={2}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Severity
                </label>
                <Select
                  value={entry.severity}
                  onValueChange={(v) =>
                    updateEntry(entry.id, "severity", v)
                  }
                >
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Assign to
                </label>
                <Select
                  value={entry.assignedTo || "unassigned"}
                  onValueChange={(v) =>
                    updateEntry(
                      entry.id,
                      "assignedTo",
                      v === "unassigned" ? null : v
                    )
                  }
                >
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {janitors.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.first_name} {j.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="outline"
        className="w-full"
        onClick={addEntry}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Another Issue
      </Button>

      <div className="flex gap-3 pb-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleSkip}
          disabled={isSubmitting}
        >
          Skip
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          {isSubmitting
            ? "Submitting..."
            : `Report ${entries.length} Issue${entries.length === 1 ? "" : "s"}`}
        </Button>
      </div>
    </div>
  )
}
