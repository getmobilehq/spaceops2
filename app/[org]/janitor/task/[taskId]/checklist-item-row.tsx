"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, StickyNote, Check, Loader2, ImageIcon } from "lucide-react"
import { uploadItemPhoto, upsertItemResponse } from "@/actions/task-responses"
import { useToast } from "@/hooks/use-toast"

interface ChecklistItemRowProps {
  item: {
    id: string
    description: string
    requires_photo: boolean
    requires_note: boolean
  }
  response: {
    is_completed: boolean
    photo_url: string | null
    note: string | null
  } | null
  roomTaskId: string
  isReadOnly: boolean
  onResponseChange: (
    itemId: string,
    update: { is_completed?: boolean; photo_url?: string; note?: string }
  ) => void
}

export function ChecklistItemRow({
  item,
  response,
  roomTaskId,
  isReadOnly,
  onResponseChange,
}: ChecklistItemRowProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showNote, setShowNote] = useState(!!response?.note)
  const [noteValue, setNoteValue] = useState(response?.note || "")

  const isCompleted = response?.is_completed ?? false
  const hasPhoto = !!response?.photo_url
  const hasNote = !!response?.note

  const photoPublicUrl = response?.photo_url
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cleaning-photos/${response.photo_url}`
    : null

  async function handleToggle() {
    if (isReadOnly || isSaving) return
    setIsSaving(true)

    const newCompleted = !isCompleted
    // Optimistic update
    onResponseChange(item.id, { is_completed: newCompleted })

    const result = await upsertItemResponse({
      roomTaskId,
      checklistItemId: item.id,
      isCompleted: newCompleted,
      note: noteValue || null,
    })

    if (!result.success) {
      // Revert on error
      onResponseChange(item.id, { is_completed: isCompleted })
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsSaving(false)
  }

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.set("roomTaskId", roomTaskId)
    formData.set("checklistItemId", item.id)
    formData.set("photo", file)

    const result = await uploadItemPhoto(formData)

    if (result.success) {
      onResponseChange(item.id, { photo_url: result.data.photoUrl })
      toast({ title: "Photo uploaded" })
    } else {
      toast({
        title: "Upload failed",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsUploading(false)
    // Reset input so re-selecting same file works
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleNoteSave() {
    if (isReadOnly || isSaving) return
    if (noteValue === (response?.note || "")) return

    setIsSaving(true)
    onResponseChange(item.id, { note: noteValue })

    const result = await upsertItemResponse({
      roomTaskId,
      checklistItemId: item.id,
      isCompleted,
      note: noteValue || null,
    })

    if (!result.success) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsSaving(false)
  }

  return (
    <div
      className={`rounded-lg border p-3 space-y-2 transition-colors ${
        isCompleted ? "bg-green-50/50 border-green-200" : "bg-white"
      }`}
    >
      {/* Main row: checkbox + description */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isReadOnly || isSaving}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-colors ${
            isCompleted
              ? "border-green-500 bg-green-500 text-white"
              : "border-gray-300 hover:border-brand"
          } ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}
          aria-label={isCompleted ? "Uncheck item" : "Check item"}
        >
          {isCompleted && <Check className="h-4 w-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm leading-snug ${
              isCompleted ? "text-muted-foreground line-through" : ""
            }`}
          >
            {item.description}
          </p>

          {/* Required badges */}
          <div className="flex items-center gap-1.5 mt-1">
            {item.requires_photo && (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${
                  hasPhoto
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {hasPhoto ? "Photo added" : "Photo required"}
              </Badge>
            )}
            {item.requires_note && (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${
                  hasNote
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {hasNote ? "Note added" : "Note required"}
              </Badge>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {!isReadOnly && (
          <div className="flex items-center gap-1 shrink-0">
            {item.requires_photo && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${hasPhoto ? "text-green-600" : "text-muted-foreground"}`}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
              </>
            )}
            {item.requires_note && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${hasNote ? "text-green-600" : "text-muted-foreground"}`}
                onClick={() => setShowNote(!showNote)}
              >
                <StickyNote className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Photo thumbnail */}
      {hasPhoto && photoPublicUrl && (
        <div className="ml-9">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoPublicUrl}
            alt="Cleaning photo"
            className="h-16 w-16 rounded border object-cover"
          />
        </div>
      )}

      {/* Read-only photo indicator */}
      {isReadOnly && hasPhoto && !photoPublicUrl && (
        <div className="ml-9 flex items-center gap-1 text-xs text-muted-foreground">
          <ImageIcon className="h-3 w-3" />
          Photo attached
        </div>
      )}

      {/* Note input */}
      {showNote && !isReadOnly && (
        <div className="ml-9">
          <textarea
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            onBlur={handleNoteSave}
            placeholder="Add a note..."
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      )}

      {/* Read-only note display */}
      {isReadOnly && hasNote && (
        <div className="ml-9 rounded-md bg-muted/50 p-2">
          <p className="text-xs text-muted-foreground">{response?.note}</p>
        </div>
      )}
    </div>
  )
}
