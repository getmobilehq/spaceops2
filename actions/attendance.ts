"use server"

import QRCode from "qrcode"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  clockInSchema,
  clockOutSchema,
  type ClockInInput,
  type ClockOutInput,
} from "@/lib/validations/attendance"

type ActionResult = { success: true } | { success: false; error: string }

interface ClockInResult {
  success: true
  attendanceId: string
  geoVerified: boolean
  distanceM: number | null
}

type ClockInActionResult = ClockInResult | { success: false; error: string }

async function getJanitorContext() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const role = user.app_metadata?.role as string | undefined
  const orgId = user.app_metadata?.org_id as string | undefined

  if (role !== "janitor" || !orgId) return null

  return { user, orgId, supabase }
}

async function getAdminContext() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const role = user.app_metadata?.role as string | undefined
  const orgId = user.app_metadata?.org_id as string | undefined

  if (role !== "admin" || !orgId) return null

  return { user, orgId, supabase }
}

/**
 * Haversine formula — distance between two GPS coordinates in metres.
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function clockIn(input: ClockInInput): Promise<ClockInActionResult> {
  const parsed = clockInSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getJanitorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Fetch building and verify org
  const { data: building, error: buildingError } = await ctx.supabase
    .from("buildings")
    .select("id, org_id, latitude, longitude, geofence_radius_m")
    .eq("id", parsed.data.buildingId)
    .single()

  if (buildingError || !building) {
    return { success: false, error: "Building not found" }
  }

  if (building.org_id !== ctx.orgId) {
    return { success: false, error: "Building does not belong to your organisation" }
  }

  // Compute distance if coordinates available
  let distanceM: number | null = null
  let geoVerified = false

  if (
    parsed.data.latitude != null &&
    parsed.data.longitude != null &&
    building.latitude != null &&
    building.longitude != null
  ) {
    distanceM = Math.round(
      haversineDistance(
        parsed.data.latitude,
        parsed.data.longitude,
        building.latitude,
        building.longitude
      )
    )
    geoVerified = distanceM <= (building.geofence_radius_m ?? 150)
  }

  // Insert attendance record
  const { data: record, error: insertError } = await ctx.supabase
    .from("attendance_records")
    .insert({
      org_id: ctx.orgId,
      building_id: parsed.data.buildingId,
      user_id: ctx.user.id,
      scan_latitude: parsed.data.latitude,
      scan_longitude: parsed.data.longitude,
      distance_m: distanceM,
      geo_verified: geoVerified,
      geo_error: parsed.data.geoError || null,
    })
    .select("id")
    .single()

  if (insertError) {
    if (insertError.code === "23505") {
      return { success: false, error: "Already clocked in at this building today" }
    }
    return { success: false, error: "Failed to record attendance" }
  }

  return {
    success: true,
    attendanceId: record.id,
    geoVerified,
    distanceM,
  }
}

export async function clockOut(input: ClockOutInput): Promise<ActionResult> {
  const parsed = clockOutSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getJanitorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { error } = await ctx.supabase
    .from("attendance_records")
    .update({ clock_out_at: new Date().toISOString() })
    .eq("id", parsed.data.attendanceId)
    .eq("user_id", ctx.user.id)
    .is("clock_out_at", null)

  if (error) return { success: false, error: "Failed to clock out" }
  return { success: true }
}

export async function generateBuildingAttendanceQR(
  buildingId: string
): Promise<ActionResult> {
  if (!buildingId) return { success: false, error: "Building ID is required" }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Verify building belongs to org
  const { data: building } = await ctx.supabase
    .from("buildings")
    .select("id")
    .eq("id", buildingId)
    .single()

  if (!building) return { success: false, error: "Building not found" }

  const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan/building/${buildingId}`
  const buffer = await QRCode.toBuffer(scanUrl, {
    type: "png",
    width: 400,
    margin: 2,
    color: { dark: "#0D1B2A", light: "#FFFFFF" },
  })

  const qrPath = `${ctx.orgId}/buildings/${buildingId}/attendance-qr.png`
  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from("qr-codes")
    .upload(qrPath, buffer, { contentType: "image/png", upsert: true })

  if (uploadError) {
    return { success: false, error: "Failed to upload QR code" }
  }

  const { error } = await ctx.supabase
    .from("buildings")
    .update({ attendance_qr_path: qrPath })
    .eq("id", buildingId)

  if (error) return { success: false, error: "Failed to update building" }
  return { success: true }
}
