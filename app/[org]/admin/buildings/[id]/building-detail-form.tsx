"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  updateBuildingSchema,
  type UpdateBuildingInput,
  BUILDING_STATUS_OPTIONS,
} from "@/lib/validations/building"
import {
  updateBuilding,
  assignSupervisor,
  removeSupervisor,
  deleteBuilding,
  updateBuildingLocation,
} from "@/actions/buildings"
import { generateBuildingAttendanceQR } from "@/actions/attendance"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
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
import { Trash2, MapPin, QrCode } from "lucide-react"
import { QRCodeDisplay } from "@/components/shared/QRCodeDisplay"

interface Supervisor {
  id: string
  first_name: string
  last_name: string
}

interface BuildingData {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  status: string
  client_id: string | null
  latitude: number | null
  longitude: number | null
  geofence_radius_m: number
  attendance_qr_path: string | null
  clients: { id: string; company_name: string } | null
  floors: {
    id: string
    floor_number: number
    floor_name: string
    plan_status: string
  }[]
  building_supervisors: {
    user_id: string
    users: { id: string; first_name: string; last_name: string; role: string }
  }[]
}

interface ClientOption {
  id: string
  companyName: string
}

const planStatusConfig: Record<
  string,
  { variant: "default" | "secondary" | "outline" | "destructive"; className?: string }
> = {
  none: { variant: "outline" },
  uploaded: { variant: "secondary" },
  vectorised: { variant: "default" },
  confirmed: {
    variant: "outline",
    className: "border-success/30 bg-success/10 text-success dark:bg-success/20",
  },
}

export function BuildingDetailForm({
  building,
  supervisors,
  clients,
  orgSlug,
}: {
  building: BuildingData
  supervisors: Supervisor[]
  clients: ClientOption[]
  orgSlug: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeletingBuilding, setIsDeletingBuilding] = useState(false)
  const [locLat, setLocLat] = useState<string>(building.latitude?.toString() ?? "")
  const [locLng, setLocLng] = useState<string>(building.longitude?.toString() ?? "")
  const [locRadius, setLocRadius] = useState<string>(building.geofence_radius_m?.toString() ?? "150")
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UpdateBuildingInput>({
    resolver: zodResolver(updateBuildingSchema),
    defaultValues: {
      buildingId: building.id,
      name: building.name,
      address: building.address,
      city: building.city || "",
      state: building.state || "",
      zipCode: building.zip_code || "",
      country: building.country || "United States",
      status: building.status as UpdateBuildingInput["status"],
      clientId: building.client_id,
    },
  })

  const assignedIds = new Set(
    building.building_supervisors.map((bs) => bs.user_id)
  )
  const availableSupervisors = supervisors.filter(
    (s) => !assignedIds.has(s.id)
  )

  async function onSubmit(data: UpdateBuildingInput) {
    setIsLoading(true)
    const result = await updateBuilding(data)

    if (result.success) {
      toast({ title: "Building updated" })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  async function handleAssign() {
    if (!selectedSupervisor) return
    setIsAssigning(true)
    const result = await assignSupervisor({
      buildingId: building.id,
      userId: selectedSupervisor,
    })

    if (result.success) {
      toast({ title: "Supervisor assigned" })
      setSelectedSupervisor("")
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsAssigning(false)
  }

  async function handleDeleteBuilding() {
    setIsDeletingBuilding(true)
    const result = await deleteBuilding({ buildingId: building.id })
    if (result.success) {
      toast({ title: "Building deleted" })
      router.push(`/${orgSlug}/admin/buildings`)
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setIsDeletingBuilding(false)
      setShowDeleteDialog(false)
    }
  }

  async function handleRemove() {
    if (!confirmRemove) return
    setIsRemoving(true)
    const result = await removeSupervisor({
      buildingId: building.id,
      userId: confirmRemove,
    })

    if (result.success) {
      toast({ title: "Supervisor removed" })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsRemoving(false)
    setConfirmRemove(null)
  }

  async function handleSaveLocation() {
    const lat = parseFloat(locLat)
    const lng = parseFloat(locLng)
    const radius = parseInt(locRadius, 10)

    if (isNaN(lat) || isNaN(lng)) {
      toast({ title: "Error", description: "Enter valid latitude and longitude", variant: "destructive" })
      return
    }

    setIsSavingLocation(true)
    const result = await updateBuildingLocation({
      buildingId: building.id,
      latitude: lat,
      longitude: lng,
      geofenceRadiusM: isNaN(radius) ? 150 : radius,
    })

    if (result.success) {
      toast({ title: "Location saved" })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsSavingLocation(false)
  }

  async function handleGenerateQR() {
    setIsGeneratingQR(true)
    const result = await generateBuildingAttendanceQR(building.id)
    if (result.success) {
      toast({ title: "Attendance QR generated" })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsGeneratingQR(false)
  }

  return (
    <>
      {/* Settings */}
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input type="hidden" {...register("buildingId")} />
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input id="address" {...register("address")} />
              {errors.address && (
                <p className="text-sm text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register("city")} />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" {...register("state")} />
                {errors.state && (
                  <p className="text-sm text-destructive">{errors.state.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input id="zipCode" {...register("zipCode")} />
                {errors.zipCode && (
                  <p className="text-sm text-destructive">{errors.zipCode.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" {...register("country")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  defaultValue={building.status}
                  onValueChange={(v) =>
                    setValue(
                      "status",
                      v as UpdateBuildingInput["status"]
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILDING_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Client</Label>
                <Select
                  defaultValue={building.client_id || "none"}
                  onValueChange={(v) =>
                    setValue("clientId", v === "none" ? null : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Building
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Attendance & Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Attendance & Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="-33.8688"
                value={locLat}
                onChange={(e) => setLocLat(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="151.2093"
                value={locLng}
                onChange={(e) => setLocLng(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="geofenceRadius">Geofence Radius (metres)</Label>
            <Input
              id="geofenceRadius"
              type="number"
              min={10}
              max={5000}
              value={locRadius}
              onChange={(e) => setLocRadius(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Janitors must be within this distance to be verified (default 150m).
            </p>
          </div>
          <Button
            onClick={handleSaveLocation}
            disabled={isSavingLocation}
            variant="outline"
            className="w-full"
          >
            {isSavingLocation ? "Saving..." : "Save Location"}
          </Button>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Attendance QR Code</span>
              </div>
              <Button
                onClick={handleGenerateQR}
                disabled={isGeneratingQR}
                size="sm"
              >
                {isGeneratingQR
                  ? "Generating..."
                  : building.attendance_qr_path
                    ? "Regenerate QR"
                    : "Generate QR"}
              </Button>
            </div>
            {building.attendance_qr_path && (
              <QRCodeDisplay
                qrCodeUrl={building.attendance_qr_path}
                roomName={building.name}
                scanUrl={`${process.env.NEXT_PUBLIC_APP_URL}/scan/building/${building.id}`}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Supervisors */}
      <Card>
        <CardHeader>
          <CardTitle>Supervisors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {building.building_supervisors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No supervisors assigned yet.
            </p>
          ) : (
            <div className="space-y-2">
              {building.building_supervisors.map((bs) => (
                <div
                  key={bs.user_id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <span className="text-sm font-medium">
                    {bs.users.first_name} {bs.users.last_name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setConfirmRemove(bs.user_id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {availableSupervisors.length > 0 && (
            <div className="flex gap-2">
              <Select
                value={selectedSupervisor}
                onValueChange={setSelectedSupervisor}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {availableSupervisors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAssign}
                disabled={!selectedSupervisor || isAssigning}
              >
                {isAssigning ? "Assigning..." : "Assign"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floors */}
      <Card>
        <CardHeader>
          <CardTitle>Floors</CardTitle>
        </CardHeader>
        <CardContent>
          {building.floors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No floors configured.
            </p>
          ) : (
            <div className="space-y-2">
              {building.floors
                .sort((a, b) => a.floor_number - b.floor_number)
                .map((floor) => {
                  const status =
                    planStatusConfig[floor.plan_status] || { variant: "outline" as const }
                  return (
                    <Link
                      key={floor.id}
                      href={`/${orgSlug}/admin/buildings/${building.id}/floors/${floor.id}`}
                      className="flex items-center justify-between rounded-md border p-3 hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium">{floor.floor_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Floor #{floor.floor_number}
                        </p>
                      </div>
                      <Badge
                        variant={status.variant}
                        className={status.className}
                      >
                        {floor.plan_status === "none"
                          ? "No Plan"
                          : floor.plan_status.charAt(0).toUpperCase() +
                            floor.plan_status.slice(1)}
                      </Badge>
                    </Link>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove supervisor confirmation dialog */}
      <Dialog
        open={!!confirmRemove}
        onOpenChange={(open) => !open && setConfirmRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Supervisor</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this supervisor from the building?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRemove(null)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isRemoving}
            >
              {isRemoving ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete building confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Building</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete &quot;{building.name}&quot;?
              This will remove all floors, rooms, activities, tasks, and
              attendance records associated with this building. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeletingBuilding}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBuilding}
              disabled={isDeletingBuilding}
            >
              {isDeletingBuilding ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
