"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  updateTemplate,
  deleteTemplate,
  upsertItem,
  deleteItem,
  reorderItems,
  setDefault,
} from "@/actions/checklists"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { GripVertical, Trash2, Camera, StickyNote, Plus, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface ItemData {
  id: string
  description: string
  item_order: number
  requires_photo: boolean
  requires_note: boolean
}

interface TemplateData {
  id: string
  name: string
  is_default: boolean
  room_type_id: string | null
  room_types: { id: string; name: string } | null
  checklist_items: ItemData[]
}

interface RoomTypeOption {
  id: string
  name: string
}

// Sortable item component
function SortableItem({
  item,
  onUpdate,
  onDelete,
}: {
  item: ItemData
  onUpdate: (id: string, field: string, value: boolean | string) => void
  onDelete: (id: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(item.description)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  function handleBlur() {
    setIsEditing(false)
    if (editValue.trim() && editValue !== item.description) {
      onUpdate(item.id, "description", editValue.trim())
    } else {
      setEditValue(item.description)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      ;(e.target as HTMLInputElement).blur()
    }
    if (e.key === "Escape") {
      setEditValue(item.description)
      setIsEditing(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-white p-2",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {isEditing ? (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-7 flex-1 text-sm"
          autoFocus
        />
      ) : (
        <button
          type="button"
          className="flex-1 text-left text-sm hover:text-brand transition-colors"
          onClick={() => {
            setIsEditing(true)
            setTimeout(() => inputRef.current?.focus(), 0)
          }}
        >
          {item.description}
        </button>
      )}

      <button
        type="button"
        className={cn(
          "rounded p-1 transition-colors",
          item.requires_photo
            ? "bg-blue-100 text-blue-700"
            : "text-muted-foreground/40 hover:text-muted-foreground"
        )}
        title="Requires photo"
        onClick={() => onUpdate(item.id, "requires_photo", !item.requires_photo)}
      >
        <Camera className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        className={cn(
          "rounded p-1 transition-colors",
          item.requires_note
            ? "bg-amber-100 text-amber-700"
            : "text-muted-foreground/40 hover:text-muted-foreground"
        )}
        title="Requires note"
        onClick={() => onUpdate(item.id, "requires_note", !item.requires_note)}
      >
        <StickyNote className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        className="rounded p-1 text-muted-foreground/40 hover:text-destructive transition-colors"
        onClick={() => onDelete(item.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function TemplateEditor({
  template,
  roomTypes,
  orgSlug,
}: {
  template: TemplateData
  roomTypes: RoomTypeOption[]
  orgSlug: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [items, setItems] = useState<ItemData[]>(template.checklist_items)
  const [newItemText, setNewItemText] = useState("")
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isSettingDefault, setIsSettingDefault] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [templateName, setTemplateName] = useState(template.name)
  const [isEditingName, setIsEditingName] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)

    const result = await reorderItems({
      templateId: template.id,
      itemIds: reordered.map((i) => i.id),
    })

    if (!result.success) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
      setItems(items) // revert
    }
  }

  async function handleAddItem() {
    if (!newItemText.trim()) return
    setIsAddingItem(true)
    const result = await upsertItem({
      templateId: template.id,
      description: newItemText.trim(),
      requiresPhoto: false,
      requiresNote: false,
    })

    if (result.success) {
      const newItem: ItemData = {
        id: result.id,
        description: newItemText.trim(),
        item_order: items.length + 1,
        requires_photo: false,
        requires_note: false,
      }
      setItems([...items, newItem])
      setNewItemText("")
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsAddingItem(false)
  }

  async function handleUpdateItem(id: string, field: string, value: boolean | string) {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    )

    const item = items.find((i) => i.id === id)
    if (!item) return

    const result = await upsertItem({
      templateId: template.id,
      itemId: id,
      description: field === "description" ? (value as string) : item.description,
      requiresPhoto: field === "requires_photo" ? (value as boolean) : item.requires_photo,
      requiresNote: field === "requires_note" ? (value as boolean) : item.requires_note,
    })

    if (!result.success) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
      router.refresh()
    }
  }

  async function handleDeleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    const result = await deleteItem({ itemId: id })
    if (!result.success) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
      router.refresh()
    }
  }

  async function handleSaveName() {
    if (!templateName.trim() || templateName === template.name) {
      setTemplateName(template.name)
      setIsEditingName(false)
      return
    }
    setIsSavingName(true)
    const result = await updateTemplate({
      templateId: template.id,
      name: templateName.trim(),
    })

    if (result.success) {
      setIsEditingName(false)
      toast({ title: "Name updated" })
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
      setTemplateName(template.name)
    }
    setIsSavingName(false)
  }

  async function handleSetDefault() {
    if (!template.room_type_id) {
      toast({
        title: "Error",
        description: "Assign a room type first before setting as default.",
        variant: "destructive",
      })
      return
    }
    setIsSettingDefault(true)
    const result = await setDefault({
      templateId: template.id,
      roomTypeId: template.room_type_id,
    })

    if (result.success) {
      toast({ title: "Set as default" })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsSettingDefault(false)
  }

  async function handleRoomTypeChange(value: string) {
    const roomTypeId = value === "none" ? null : value
    const result = await updateTemplate({
      templateId: template.id,
      roomTypeId,
    })
    if (result.success) {
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteTemplate({ templateId: template.id })
    if (result.success) {
      toast({ title: "Template deleted" })
      router.push(`/${orgSlug}/admin/checklists`)
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-1">
              {isEditingName ? (
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName()
                    if (e.key === "Escape") {
                      setTemplateName(template.name)
                      setIsEditingName(false)
                    }
                  }}
                  disabled={isSavingName}
                  autoFocus
                  className="text-lg font-bold"
                />
              ) : (
                <button
                  type="button"
                  className="text-left"
                  onClick={() => setIsEditingName(true)}
                >
                  <CardTitle className="hover:text-brand transition-colors">
                    {templateName}
                  </CardTitle>
                </button>
              )}
              <div className="flex items-center gap-2">
                {template.is_default && (
                  <Badge
                    variant="outline"
                    className="border-green-200 bg-green-50 text-green-700"
                  >
                    Default
                  </Badge>
                )}
                {template.room_types && (
                  <Badge variant="secondary">
                    {template.room_types.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Room Type</Label>
              <Select
                defaultValue={template.room_type_id || "none"}
                onValueChange={handleRoomTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General</SelectItem>
                  {roomTypes.map((rt) => (
                    <SelectItem key={rt.id} value={rt.id}>
                      {rt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              {!template.is_default && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSettingDefault || !template.room_type_id}
                  onClick={handleSetDefault}
                >
                  <Star className="mr-1 h-3.5 w-3.5" />
                  {isSettingDefault ? "Setting..." : "Set as Default"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            Checklist Items ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No items yet. Add your first checklist item below.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {items.map((item) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Add item input */}
          <div className="flex gap-2 pt-2">
            <Input
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddItem()
                }
              }}
              placeholder="Add a checklist item..."
              className="flex-1"
              disabled={isAddingItem}
            />
            <Button
              size="sm"
              onClick={handleAddItem}
              disabled={isAddingItem || !newItemText.trim()}
            >
              <Plus className="mr-1 h-4 w-4" />
              {isAddingItem ? "..." : "Add"}
            </Button>
          </div>

          <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Camera className="h-3 w-3" /> = Requires photo
            </span>
            <span className="flex items-center gap-1">
              <StickyNote className="h-3 w-3" /> = Requires note
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Back link */}
      <Button
        variant="outline"
        onClick={() => router.push(`/${orgSlug}/admin/checklists`)}
      >
        Back to Checklists
      </Button>

      {/* Delete confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{template.name}&quot;? This will
              remove all checklist items and any room overrides using this template.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
