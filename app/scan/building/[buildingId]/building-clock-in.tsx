"use client"

import { useState, useEffect } from "react"
import { clockIn, clockOut } from "@/actions/attendance"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  LogIn,
  LogOut,
  Building2,
} from "lucide-react"

interface BuildingInfo {
  id: string
  name: string
  address: string
  hasLocation: boolean
}

interface ExistingAttendance {
  id: string
  clockInAt: string
  clockOutAt: string | null
  geoVerified: boolean
  distanceM: number | null
}

export function BuildingClockIn({
  building,
  orgSlug,
  existingAttendance,
}: {
  building: BuildingInfo
  orgSlug: string
  existingAttendance: ExistingAttendance | null
}) {
  const [gpsState, setGpsState] = useState<"acquiring" | "acquired" | "error" | "idle">("idle")
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{
    type: "success" | "error"
    message: string
    geoVerified?: boolean
    distanceM?: number | null
    attendanceId?: string
  } | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const [attendance, setAttendance] = useState(existingAttendance)

  // Request GPS on mount
  useEffect(() => {
    if (attendance && !attendance.clockOutAt) return // Already clocked in

    if (!navigator.geolocation) {
      setGpsState("error")
      setGeoError("geolocation_unsupported")
      return
    }

    setGpsState("acquiring")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setGpsState("acquired")
      },
      (err) => {
        setGpsState("error")
        setGeoError(err.code === 1 ? "permission_denied" : err.code === 2 ? "position_unavailable" : "timeout")
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [attendance])

  async function handleClockIn() {
    setIsSubmitting(true)
    const res = await clockIn({
      buildingId: building.id,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      geoError: geoError,
    })

    if (res.success) {
      setResult({
        type: "success",
        message: res.geoVerified
          ? "Clocked in successfully — location verified"
          : "Clocked in — location not verified",
        geoVerified: res.geoVerified,
        distanceM: res.distanceM,
        attendanceId: res.attendanceId,
      })
      setRedirecting(true)
      // Hard navigation to today's tasks — router.push won't work reliably
      // across the public /scan layout and the protected org layout
      setTimeout(() => {
        window.location.href = `/${orgSlug}/janitor/today`
      }, 1500)
    } else {
      setResult({ type: "error", message: res.error })
      setIsSubmitting(false)
    }
  }

  async function handleClockOut() {
    if (!attendance) return
    setIsSubmitting(true)
    const res = await clockOut({ attendanceId: attendance.id })
    if (res.success) {
      setAttendance((prev) =>
        prev ? { ...prev, clockOutAt: new Date().toISOString() } : null
      )
      setResult({ type: "success", message: "Clocked out successfully" })
    } else {
      setResult({ type: "error", message: res.error })
    }
    setIsSubmitting(false)
  }

  const isAlreadyClockedIn = attendance && !attendance.clockOutAt
  const isAlreadyClockedOut = attendance && attendance.clockOutAt

  return (
    <div className="w-full max-w-md space-y-4">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-primary">{building.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{building.address}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GPS status */}
          {!isAlreadyClockedIn && !isAlreadyClockedOut && (
            <div className="flex items-center justify-center gap-2 text-sm">
              {gpsState === "acquiring" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Acquiring GPS location...</span>
                </>
              )}
              {gpsState === "acquired" && (
                <>
                  <MapPin className="h-4 w-4 text-success" />
                  <span className="text-success">Location acquired</span>
                </>
              )}
              {gpsState === "error" && (
                <>
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-warning">
                    {geoError === "permission_denied"
                      ? "Location access denied"
                      : "Could not get location"}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Already clocked in today */}
          {isAlreadyClockedIn && (
            <div className="text-center space-y-3">
              <Badge
                variant="outline"
                className={
                  attendance.geoVerified
                    ? "border-success/30 bg-success/10 text-success dark:bg-success/20"
                    : "border-warning/30 bg-warning/10 text-warning dark:bg-warning/20"
                }
              >
                {attendance.geoVerified ? (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                ) : (
                  <AlertTriangle className="mr-1 h-3 w-3" />
                )}
                {attendance.geoVerified ? "Verified" : "Unverified"}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Clocked in at{" "}
                {new Date(attendance.clockInAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <Button
                onClick={handleClockOut}
                disabled={isSubmitting}
                variant="outline"
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Clock Out
              </Button>
            </div>
          )}

          {/* Already clocked out */}
          {isAlreadyClockedOut && (
            <div className="text-center space-y-2">
              <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
              <p className="text-sm font-medium">Attendance Complete</p>
              <p className="text-xs text-muted-foreground">
                In:{" "}
                {new Date(attendance.clockInAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                — Out:{" "}
                {new Date(attendance.clockOutAt!).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}

          {/* Redirecting after successful clock-in */}
          {redirecting && result && (
            <div
              className={`rounded-md p-3 text-center text-sm ${
                result.geoVerified
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning"
              }`}
            >
              <CheckCircle2 className="mx-auto h-6 w-6 mb-2" />
              {result.message}
              {result.distanceM != null && (
                <p className="text-xs mt-1 opacity-75">
                  Distance: {result.distanceM}m from building
                </p>
              )}
              <div className="flex items-center justify-center gap-2 mt-3 text-xs opacity-75">
                <Loader2 className="h-3 w-3 animate-spin" />
                Redirecting to your tasks...
              </div>
            </div>
          )}

          {/* Clock in button */}
          {!isAlreadyClockedIn && !isAlreadyClockedOut && !result && !redirecting && (
            <Button
              onClick={handleClockIn}
              disabled={isSubmitting || gpsState === "acquiring"}
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Clock In
            </Button>
          )}

          {/* Error display */}
          {result && result.type === "error" && (
            <div className="rounded-md p-3 text-center text-sm bg-destructive/10 text-destructive">
              {result.message}
            </div>
          )}

          {/* GPS warning for unverified */}
          {gpsState === "error" && !isAlreadyClockedIn && !isAlreadyClockedOut && !redirecting && (
            <p className="text-xs text-muted-foreground text-center">
              You can still clock in without GPS, but your attendance will be marked as unverified.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
