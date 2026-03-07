"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
  scanInspectionRoom,
  completeInspection,
} from "@/actions/inspections"
import { QrScannerDialog } from "@/components/shared/QrScannerDialog"
import {
  CheckCircle2,
  XCircle,
  Building2,
  Clock,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

interface InspectionData {
  id: string
  room_id: string
  status: string
  notes: string | null
  inspection_scan_at: string | null
  inspected_at: string | null
  created_at: string
  rooms: {
    id: string
    name: string
    room_types: { name: string } | null
  } | null
  floors: { floor_name: string } | null
  buildings: { name: string } | null
}

export function StandaloneInspectionView({
  inspection,
  orgSlug,
}: {
  inspection: InspectionData
  orgSlug: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inspectionNote, setInspectionNote] = useState("")

  const isScannedIn = !!inspection.inspection_scan_at
  const isCompleted = inspection.status !== "pending"

  async function handleComplete(result: "passed" | "failed") {
    setIsSubmitting(true)
    const res = await completeInspection({
      inspectionId: inspection.id,
      result,
      notes: inspectionNote || undefined,
    })

    if (res.success) {
      toast({
        title: result === "passed" ? "Inspection passed" : "Inspection failed",
      })
      if (result === "failed") {
        router.push(
          `/${orgSlug}/supervisor/issues/new?inspectionId=${inspection.id}`
        )
      } else {
        router.push(`/${orgSlug}/supervisor/inspections`)
      }
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: res.error,
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  const statusBadge = () => {
    switch (inspection.status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-warning/30 bg-warning/10 text-warning"
          >
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "passed":
        return (
          <Badge
            variant="outline"
            className="border-success/30 bg-success/10 text-success"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Passed
          </Badge>
        )
      case "failed":
        return (
          <Badge
            variant="outline"
            className="border-destructive/30 bg-destructive/10 text-destructive"
          >
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        href={`/${orgSlug}/supervisor/inspections`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Inspections
      </Link>

      {/* Room header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-primary">
              {inspection.rooms?.name || "Unknown Room"}
            </CardTitle>
            {statusBadge()}
          </div>
          {inspection.rooms?.room_types && (
            <Badge variant="secondary" className="w-fit">
              {inspection.rooms.room_types.name}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          {inspection.buildings && (
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" />
              <span>
                {inspection.buildings.name} ·{" "}
                {inspection.floors?.floor_name || "Unknown Floor"}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Started{" "}
              {new Date(inspection.created_at).toLocaleString("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
          {inspection.inspected_at && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                Completed{" "}
                {new Date(inspection.inspected_at).toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed state */}
      {isCompleted && (
        <Card>
          <CardContent className="py-6 text-center space-y-2">
            {inspection.status === "passed" ? (
              <CheckCircle2 className="h-12 w-12 mx-auto text-success" />
            ) : (
              <XCircle className="h-12 w-12 mx-auto text-destructive" />
            )}
            <p className="font-medium">
              Inspection{" "}
              {inspection.status === "passed" ? "Passed" : "Failed"}
            </p>
            {inspection.notes && (
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {inspection.notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* QR Scan Gate — only for pending inspections */}
      {!isCompleted && !isScannedIn && (
        <QrScannerDialog
          expectedRoomId={inspection.room_id}
          onScanSuccess={async (roomId) => {
            const result = await scanInspectionRoom({
              inspectionId: inspection.id,
              roomId,
            })
            if (!result.success) throw new Error(result.error)
            router.refresh()
          }}
          buttonLabel="Scan Room QR Code"
          description="Point your camera at the QR code on the room wall to verify your presence before inspecting."
          variant="blue"
        />
      )}

      {/* Inspection form — after QR scan */}
      {!isCompleted && isScannedIn && (
        <>
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Room verified via QR scan. Review the room and record your
                inspection result below.
              </p>
            </CardContent>
          </Card>

          {/* Inspection note */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Inspection Note (optional)
            </label>
            <textarea
              value={inspectionNote}
              onChange={(e) => setInspectionNote(e.target.value)}
              placeholder="Add any comments about the inspection..."
              rows={3}
              maxLength={500}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pb-4">
            <Button
              variant="outline"
              className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => handleComplete("failed")}
              disabled={isSubmitting}
            >
              <XCircle className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : "Fail"}
            </Button>
            <Button
              className="flex-1"
              onClick={() => handleComplete("passed")}
              disabled={isSubmitting}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : "Pass"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
