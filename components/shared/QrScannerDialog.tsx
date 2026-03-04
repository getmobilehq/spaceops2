"use client"

import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { QrCode, Camera } from "lucide-react"

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  { ssr: false }
)

/** Extract room ID from a scanned QR URL like https://app.example.com/scan/{roomId} */
function extractRoomId(scannedValue: string): string | null {
  try {
    // Handle full URLs
    const url = new URL(scannedValue)
    const parts = url.pathname.split("/")
    const scanIndex = parts.indexOf("scan")
    if (scanIndex !== -1 && parts[scanIndex + 1]) {
      return parts[scanIndex + 1]
    }
  } catch {
    // Handle relative paths like /scan/{roomId}
    const parts = scannedValue.split("/")
    const scanIndex = parts.indexOf("scan")
    if (scanIndex !== -1 && parts[scanIndex + 1]) {
      return parts[scanIndex + 1]
    }
  }
  return null
}

interface QrScannerDialogProps {
  /** The expected room ID — scanned QR must match */
  expectedRoomId: string
  /** Callback when a valid QR is scanned matching the expected room */
  onScanSuccess: (roomId: string) => Promise<void>
  /** Button label */
  buttonLabel?: string
  /** Description shown in the dialog */
  description?: string
  /** Color variant */
  variant?: "amber" | "blue"
}

export function QrScannerDialog({
  expectedRoomId,
  onScanSuccess,
  buttonLabel = "Scan QR Code",
  description = "Point your camera at the QR code on the room wall.",
  variant = "amber",
}: QrScannerDialogProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const colors = variant === "amber"
    ? { bg: "bg-warning/20", icon: "text-warning", heading: "text-warning", text: "text-warning", border: "border-warning/30", cardBg: "bg-warning/10", btnBg: "bg-warning text-warning-foreground hover:bg-warning/90" }
    : { bg: "bg-info/20", icon: "text-info", heading: "text-info", text: "text-info", border: "border-info/30", cardBg: "bg-info/10", btnBg: "bg-info text-info-foreground hover:bg-info/90" }

  const handleScan = useCallback(
    async (result: { rawValue: string }[]) => {
      if (processing || !result?.[0]?.rawValue) return

      const scannedRoomId = extractRoomId(result[0].rawValue)

      if (!scannedRoomId) {
        setError("Invalid QR code. Please scan a SpaceOps room QR code.")
        return
      }

      if (scannedRoomId !== expectedRoomId) {
        setError("Wrong room! This QR code belongs to a different room.")
        return
      }

      setProcessing(true)
      setError(null)

      try {
        await onScanSuccess(scannedRoomId)
        setOpen(false)
      } catch {
        setError("Failed to check in. Please try again.")
      } finally {
        setProcessing(false)
      }
    },
    [expectedRoomId, onScanSuccess, processing]
  )

  return (
    <>
      <div className={`rounded-lg border ${colors.border} ${colors.cardBg} p-6 text-center space-y-4`}>
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${colors.bg}`}>
          <QrCode className={`h-8 w-8 ${colors.icon}`} />
        </div>
        <div className="space-y-2">
          <h3 className={`font-semibold ${colors.heading}`}>{buttonLabel}</h3>
          <p className={`text-sm ${colors.text} max-w-xs mx-auto`}>
            Tap the button below to open your camera and scan the QR code on the room wall.
          </p>
        </div>
        <Button
          onClick={() => { setOpen(true); setError(null) }}
          className={`${colors.btnBg}`}
        >
          <Camera className="mr-2 h-4 w-4" />
          Open Camera
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scan Room QR Code
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="relative w-full aspect-square bg-black">
            {!processing && (
              <Scanner
                onScan={handleScan}
                onError={() => setError("Camera access denied. Please allow camera permissions.")}
                constraints={{ facingMode: "environment" }}
                styles={{
                  container: { width: "100%", height: "100%" },
                  video: { width: "100%", height: "100%", objectFit: "cover" },
                }}
              />
            )}
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-center text-white space-y-2">
                  <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <p className="text-sm">Verifying...</p>
                </div>
              </div>
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
    </>
  )
}
