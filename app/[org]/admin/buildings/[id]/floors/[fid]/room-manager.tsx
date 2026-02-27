"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  createRoomSchema,
  createRoomTypeSchema,
  type CreateRoomInput,
  type CreateRoomTypeInput,
} from "@/lib/validations/room"
import {
  createRoom,
  updateRoom,
  deleteRoom,
  createCustomRoomType,
} from "@/actions/rooms"
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
import { Plus, Trash2, QrCode, Power, ClipboardCheck } from "lucide-react"
import { QRCodeDisplay } from "@/components/shared/QRCodeDisplay"
import { setOverride } from "@/actions/checklists"

interface RoomData {
  id: string
  name: string
  room_type_id: string
  qr_code_url: string | null
  is_active: boolean
  room_types: { name: string } | null
  room_checklist_overrides: {
    template_id: string
    checklist_templates: { name: string } | null
  } | null
}

interface RoomTypeOption {
  id: string
  name: string
  is_default: boolean
}

interface TemplateOption {
  id: string
  name: string
  is_default: boolean
  room_type_id: string | null
}

export function RoomManager({
  rooms: initialRooms,
  roomTypes: initialRoomTypes,
  templates,
  floorId,
}: {
  rooms: RoomData[]
  roomTypes: RoomTypeOption[]
  templates: TemplateOption[]
  floorId: string
  orgSlug: string
  buildingId: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [showAddForm, setShowAddForm] = useState(false)
  const [showNewType, setShowNewType] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isCreatingType, setIsCreatingType] = useState(false)
  const [qrRoom, setQrRoom] = useState<RoomData | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [roomTypes, setRoomTypes] = useState(initialRoomTypes)
  const [overrideRoom, setOverrideRoom] = useState<RoomData | null>(null)
  const [overrideTemplateId, setOverrideTemplateId] = useState<string>("default")
  const [isSavingOverride, setIsSavingOverride] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: { floorId, name: "", roomTypeId: "" },
  })

  const typeForm = useForm<CreateRoomTypeInput>({
    resolver: zodResolver(createRoomTypeSchema),
  })

  async function onCreateRoom(data: CreateRoomInput) {
    setIsCreating(true)
    const result = await createRoom(data)

    if (result.success) {
      toast({ title: "Room created" })
      reset({ floorId, name: "", roomTypeId: "" })
      setShowAddForm(false)
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsCreating(false)
  }

  async function onCreateType(data: CreateRoomTypeInput) {
    setIsCreatingType(true)
    const result = await createCustomRoomType(data)

    if (result.success) {
      const newType = { id: result.id, name: data.name, is_default: false }
      setRoomTypes([...roomTypes, newType].sort((a, b) => a.name.localeCompare(b.name)))
      setValue("roomTypeId", result.id)
      setShowNewType(false)
      typeForm.reset()
      toast({ title: "Room type created" })
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsCreatingType(false)
  }

  async function handleToggleActive(roomId: string, currentlyActive: boolean) {
    setTogglingId(roomId)
    const result = await updateRoom({ roomId, isActive: !currentlyActive })

    if (result.success) {
      toast({ title: currentlyActive ? "Room deactivated" : "Room activated" })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setTogglingId(null)
  }

  async function handleDelete() {
    if (!confirmDelete) return
    setIsDeleting(true)
    const result = await deleteRoom({ roomId: confirmDelete })

    if (result.success) {
      toast({ title: "Room deleted" })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsDeleting(false)
    setConfirmDelete(null)
  }

  function openOverrideDialog(room: RoomData) {
    setOverrideRoom(room)
    setOverrideTemplateId(
      room.room_checklist_overrides?.template_id || "default"
    )
  }

  async function handleSaveOverride() {
    if (!overrideRoom) return
    setIsSavingOverride(true)
    const result = await setOverride({
      roomId: overrideRoom.id,
      templateId: overrideTemplateId === "default" ? null : overrideTemplateId,
    })
    if (result.success) {
      toast({ title: "Checklist updated" })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsSavingOverride(false)
    setOverrideRoom(null)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Rooms</CardTitle>
          {!showAddForm && (
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Room
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add Room inline form */}
          {showAddForm && (
            <div className="rounded-md border p-4 space-y-3">
              <p className="text-sm font-medium">New Room</p>
              <div className="space-y-2">
                <Label className="text-xs">Name</Label>
                <Input
                  placeholder="e.g. Room 101"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Room Type</Label>
                <Select
                  onValueChange={(v) => setValue("roomTypeId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.roomTypeId && (
                  <p className="text-xs text-destructive">{errors.roomTypeId.message}</p>
                )}
              </div>

              {/* Custom room type inline */}
              {!showNewType ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowNewType(true)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Custom type
                </Button>
              ) : (
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      placeholder="Type name"
                      {...typeForm.register("name")}
                      className="h-8 text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="h-8"
                    disabled={isCreatingType}
                    onClick={typeForm.handleSubmit(onCreateType)}
                  >
                    {isCreatingType ? "..." : "Add"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      setShowNewType(false)
                      typeForm.reset()
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  disabled={isCreating}
                  onClick={handleSubmit(onCreateRoom)}
                >
                  {isCreating ? "Creating..." : "Create Room"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false)
                    reset({ floorId, name: "", roomTypeId: "" })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Room list */}
          {initialRooms.length === 0 && !showAddForm ? (
            <p className="text-sm text-muted-foreground">
              No rooms added yet.
            </p>
          ) : (
            <div className="space-y-2">
              {initialRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">{room.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {room.room_types?.name || "Unknown type"}
                      </p>
                    </div>
                    {!room.is_active && (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Checklist override"
                      onClick={() => openOverrideDialog(room)}
                    >
                      <ClipboardCheck
                        className={`h-4 w-4 ${
                          room.room_checklist_overrides
                            ? "text-brand"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                    {room.qr_code_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setQrRoom(room)}
                      >
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={togglingId === room.id}
                      onClick={() => handleToggleActive(room.id, room.is_active)}
                    >
                      <Power
                        className={`h-4 w-4 ${
                          room.is_active
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setConfirmDelete(room.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={!!qrRoom} onOpenChange={(open) => !open && setQrRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{qrRoom?.name} — QR Code</DialogTitle>
            <DialogDescription>
              Scan this code to access the room.
            </DialogDescription>
          </DialogHeader>
          {qrRoom?.qr_code_url && (
            <QRCodeDisplay
              qrCodeUrl={qrRoom.qr_code_url}
              roomName={qrRoom.name}
              scanUrl={`${process.env.NEXT_PUBLIC_APP_URL}/scan/${qrRoom.id}`}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Room</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this room? This will also remove its QR code.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
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

      {/* Checklist override dialog */}
      <Dialog
        open={!!overrideRoom}
        onOpenChange={(open) => !open && setOverrideRoom(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checklist — {overrideRoom?.name}</DialogTitle>
            <DialogDescription>
              Choose a checklist template for this room, or use the room type default.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Select
              value={overrideTemplateId}
              onValueChange={setOverrideTemplateId}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  Use room type default
                </SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    {t.is_default ? " (default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOverrideRoom(null)}
              disabled={isSavingOverride}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveOverride}
              disabled={isSavingOverride}
            >
              {isSavingOverride ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
