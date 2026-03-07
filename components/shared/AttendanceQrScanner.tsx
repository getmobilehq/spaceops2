"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Camera } from "lucide-react"

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  { ssr: false }
)

/** Extract building ID from a scanned QR URL like https://app.example.com/scan/building/{buildingId} */
function extractBuildingId(scannedValue: string): string | null {
  try {
    const url = new URL(scannedValue)
    const parts = url.pathname.split("/")
    const buildingIndex = parts.indexOf("building")
    if (buildingIndex !== -1 && parts[buildingIndex + 1]) {
      return parts[buildingIndex + 1]
    }
  } catch {
    const parts = scannedValue.split("/")
    const buildingIndex = parts.indexOf("building")
    if (buildingIndex !== -1 && parts[buildingIndex + 1]) {
      return parts[buildingIndex + 1]
    }
  }
  return null
}

interface AttendanceQrScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AttendanceQrScanner({
  open,
  onOpenChange,
}: AttendanceQrScannerProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleScan = useCallback(
    (result: { rawValue: string }[]) => {
      if (processing || !result?.[0]?.rawValue) return

      const buildingId = extractBuildingId(result[0].rawValue)

      if (!buildingId) {
        setError(
          "Invalid QR code. Please scan the building attendance QR code."
        )
        return
      }

      setProcessing(true)
      setError(null)
      onOpenChange(false)
      router.push(`/scan/building/${buildingId}`)
    },
    [processing, onOpenChange, router]
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) {
          setError(null)
          setProcessing(false)
        }
      }}
    >
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Attendance QR Code
          </DialogTitle>
          <DialogDescription>
            Point your camera at the QR code at the building entrance to clock
            in.
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full aspect-square bg-black">
          {!processing && (
            <Scanner
              onScan={handleScan}
              onError={() =>
                setError(
                  "Camera access denied. Please allow camera permissions."
                )
              }
              constraints={{ facingMode: "environment" }}
              styles={{
                container: { width: "100%", height: "100%" },
                video: {
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                },
              }}
            />
          )}
        </div>

        {error && (
          <div className="px-4 pb-4">
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
