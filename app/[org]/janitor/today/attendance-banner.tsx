"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { clockOut } from "@/actions/attendance"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AttendanceQrScanner } from "@/components/shared/AttendanceQrScanner"
import { Camera, CheckCircle2, AlertTriangle, LogOut, Loader2 } from "lucide-react"

interface AttendanceRecord {
  id: string
  clock_in_at: string
  clock_out_at: string | null
  geo_verified: boolean
  buildings: { name: string } | null
}

export function AttendanceBanner({
  attendance,
  hasTasks,
}: {
  attendance: AttendanceRecord[]
  hasTasks: boolean
}) {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [clockingOutId, setClockingOutId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  const openAttendance = attendance.filter((a) => !a.clock_out_at)
  const hasAttendance = attendance.length > 0

  async function handleClockOut(attendanceId: string) {
    setClockingOutId(attendanceId)
    setMessage(null)
    const res = await clockOut({ attendanceId })
    if (res.success) {
      // Refresh so the now-closed shift drops out of the banner and the
      // recorded hours flow through to attendance/payroll reporting.
      setMessage({ type: "success", text: "Clocked out — your shift has been recorded." })
      router.refresh()
    } else {
      setMessage({ type: "error", text: res.error })
    }
    setClockingOutId(null)
  }

  // Not clocked in and has tasks — show prominent clock-in card
  if (!hasAttendance && hasTasks) {
    return (
      <>
        <button
          onClick={() => setScannerOpen(true)}
          className="w-full text-left active:scale-[0.98] transition-transform"
        >
          <Card className="border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
            <CardContent className="py-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Camera className="h-8 w-8 text-primary" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-primary" />
                  </span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-primary">
                    Tap to Clock In
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Scan the building QR code to start your shift
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </button>
        <AttendanceQrScanner
          open={scannerOpen}
          onOpenChange={setScannerOpen}
        />
      </>
    )
  }

  // Clocked in — show each active attendance record
  return (
    <>
      {message && (
        <div
          className={`rounded-md p-3 text-center text-sm ${
            message.type === "success"
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}
      {openAttendance.map((a) => {
        const building = a.buildings as { name: string } | null
        const clockInTime = new Date(a.clock_in_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
        return (
          <Card
            key={a.id}
            className={
              a.geo_verified
                ? "border-success/30 bg-success/5"
                : "border-warning/30 bg-warning/5"
            }
          >
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    a.geo_verified ? "bg-success/10" : "bg-warning/10"
                  }`}
                >
                  {a.geo_verified ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Clocked in at {building?.name || "building"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {clockInTime}
                    {!a.geo_verified && " · Unverified"}
                  </p>
                </div>
                <Button
                  onClick={() => handleClockOut(a.id)}
                  disabled={clockingOutId === a.id}
                  variant="outline"
                  size="sm"
                >
                  {clockingOutId === a.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  Clock Out
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </>
  )
}
