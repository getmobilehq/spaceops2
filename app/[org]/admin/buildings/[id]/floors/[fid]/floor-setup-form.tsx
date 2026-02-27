"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { uploadFloorPlan, confirmFloorPlan } from "@/actions/buildings"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Upload, Check, FileImage } from "lucide-react"

interface FloorData {
  id: string
  floor_name: string
  floor_number: number
  plan_status: string
  vectorised_plans: {
    id: string
    original_path: string
    svg_path: string | null
  } | null
}

export function FloorSetupForm({
  floor,
  buildingId,
  orgSlug,
}: {
  floor: FloorData
  buildingId: string
  orgSlug: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const plan = floor.vectorised_plans

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("plan", file)
    formData.append("floorId", floor.id)
    formData.append("buildingId", buildingId)

    const result = await uploadFloorPlan(formData)

    if (result.success) {
      toast({
        title: "Floor plan uploaded",
        description: "The floor plan has been uploaded successfully.",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsUploading(false)
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleConfirm() {
    setIsConfirming(true)
    const result = await confirmFloorPlan(floor.id)

    if (result.success) {
      toast({
        title: "Floor plan confirmed",
        description: "The floor plan has been marked as confirmed.",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsConfirming(false)
  }

  return (
    <>
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Floor Plan Status</CardTitle>
          <CardDescription>
            Upload a floor plan image, then confirm it for use in activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {["Upload", "Uploaded", "Confirmed"].map((label, i) => {
              const stepStatus =
                i === 0
                  ? "completed"
                  : floor.plan_status === "none"
                    ? "upcoming"
                    : i === 1 && (floor.plan_status === "uploaded" || floor.plan_status === "vectorised")
                      ? "current"
                      : i === 1 && floor.plan_status === "confirmed"
                        ? "completed"
                        : i === 2 && floor.plan_status === "confirmed"
                          ? "completed"
                          : "upcoming"

              return (
                <div key={label} className="flex items-center gap-2">
                  {i > 0 && (
                    <div
                      className={`h-px w-8 ${
                        stepStatus !== "upcoming" ? "bg-brand" : "bg-muted"
                      }`}
                    />
                  )}
                  <Badge
                    variant={
                      stepStatus === "completed"
                        ? "default"
                        : stepStatus === "current"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {stepStatus === "completed" && (
                      <Check className="mr-1 h-3 w-3" />
                    )}
                    {label}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            {floor.plan_status === "none" ? "Upload Floor Plan" : "Floor Plan"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan && (
            <div className="flex items-center gap-3 rounded-md border p-3">
              <FileImage className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Floor plan uploaded</p>
                <p className="text-xs text-muted-foreground">
                  {plan.original_path.split("/").pop()}
                </p>
              </div>
            </div>
          )}

          {floor.plan_status === "uploaded" && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                Floor plan is uploaded. In a future sprint, vectorisation will
                happen automatically. For now, confirm the plan manually when
                ready.
              </p>
            </div>
          )}

          {floor.plan_status === "confirmed" && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3">
              <p className="text-sm text-green-800">
                Floor plan is confirmed and ready for use in activities.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              variant={floor.plan_status === "none" ? "default" : "outline"}
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading
                ? "Uploading..."
                : floor.plan_status === "none"
                  ? "Upload Floor Plan"
                  : "Re-upload"}
            </Button>

            {(floor.plan_status === "uploaded" ||
              floor.plan_status === "vectorised") && (
              <Button
                onClick={handleConfirm}
                disabled={isConfirming}
              >
                <Check className="mr-2 h-4 w-4" />
                {isConfirming ? "Confirming..." : "Confirm Floor Plan"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Back link */}
      <Button
        variant="outline"
        onClick={() =>
          router.push(`/${orgSlug}/admin/buildings/${buildingId}`)
        }
      >
        Back to Building
      </Button>
    </>
  )
}
