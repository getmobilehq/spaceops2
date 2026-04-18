"use server"

import { createClient } from "@/lib/supabase/server"
import {
  upsertPayrollSettingsSchema,
  generatePayrollRunSchema,
  approvePayrollRunSchema,
  deletePayrollRunSchema,
  type UpsertPayrollSettingsInput,
  type GeneratePayrollRunInput,
  type ApprovePayrollRunInput,
  type DeletePayrollRunInput,
} from "@/lib/validations/payroll"
import {
  getPayrollSettings,
  getEmployeesForPayroll,
  getAttendanceHoursForPayroll,
  getPayrollRunDetail,
} from "@/lib/queries/payroll"

type ActionResult = { success: true } | { success: false; error: string }

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

export async function upsertPayrollSettings(
  input: UpsertPayrollSettingsInput
): Promise<ActionResult> {
  const parsed = upsertPayrollSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { error } = await ctx.supabase.from("payroll_settings").upsert(
    {
      org_id: ctx.orgId,
      user_id: parsed.data.userId,
      hourly_rate: parsed.data.hourlyRate,
      overtime_threshold_hours: parsed.data.overtimeThresholdHours,
      overtime_multiplier: parsed.data.overtimeMultiplier,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id,user_id" }
  )

  if (error) return { success: false, error: error.message }
  return { success: true }
}

const DEFAULT_HOURLY_RATE = 15.0
const DEFAULT_OT_THRESHOLD = 40.0
const DEFAULT_OT_MULTIPLIER = 1.5

export async function generatePayrollRun(
  input: GeneratePayrollRunInput
): Promise<{ success: true; runId: string } | { success: false; error: string }> {
  const parsed = generatePayrollRunSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { periodStart, periodEnd, notes } = parsed.data

  const [employees, settings, hours] = await Promise.all([
    getEmployeesForPayroll(ctx.supabase),
    getPayrollSettings(ctx.supabase),
    getAttendanceHoursForPayroll(ctx.supabase, periodStart, periodEnd),
  ])

  if (employees.length === 0) {
    return { success: false, error: "No active employees found" }
  }

  const settingsMap = new Map(settings.map((s) => [s.userId, s]))
  const hoursMap = new Map(hours.map((h) => [h.userId, h]))

  const lines = employees.map((emp) => {
    const empSettings = settingsMap.get(emp.id)
    const empHours = hoursMap.get(emp.id)

    const hourlyRate = empSettings?.hourlyRate ?? DEFAULT_HOURLY_RATE
    const otThreshold = empSettings?.overtimeThresholdHours ?? DEFAULT_OT_THRESHOLD
    const otMultiplier = empSettings?.overtimeMultiplier ?? DEFAULT_OT_MULTIPLIER
    const totalHours = empHours?.hoursWorked ?? 0
    const shifts = empHours?.shifts ?? 0

    const regularHours = Math.min(totalHours, otThreshold)
    const overtimeHours = Math.max(0, totalHours - otThreshold)
    const regularPay = Math.round(regularHours * hourlyRate * 100) / 100
    const overtimePay =
      Math.round(overtimeHours * hourlyRate * otMultiplier * 100) / 100
    const grossPay = Math.round((regularPay + overtimePay) * 100) / 100

    return {
      user_id: emp.id,
      employee_name: `${emp.firstName} ${emp.lastName}`,
      hourly_rate: hourlyRate,
      total_hours: totalHours,
      regular_hours: regularHours,
      overtime_hours: overtimeHours,
      overtime_multiplier: otMultiplier,
      regular_pay: regularPay,
      overtime_pay: overtimePay,
      gross_pay: grossPay,
      shifts,
    }
  })

  const totalGrossPay = lines.reduce((sum, l) => sum + l.gross_pay, 0)

  // Verify the admin exists in public.users before setting created_by
  const { data: adminUser } = await ctx.supabase
    .from("users")
    .select("id")
    .eq("id", ctx.user.id)
    .maybeSingle()

  const { data: run, error: runError } = await ctx.supabase
    .from("payroll_runs")
    .insert({
      org_id: ctx.orgId,
      period_start: periodStart,
      period_end: periodEnd,
      status: "draft",
      total_gross_pay: Math.round(totalGrossPay * 100) / 100,
      employee_count: employees.length,
      notes: notes || null,
      created_by: adminUser?.id || null,
    })
    .select("id")
    .single()

  if (runError || !run) {
    return { success: false, error: runError?.message || "Failed to create payroll run" }
  }

  const lineRows = lines.map((l) => ({
    payroll_run_id: run.id,
    org_id: ctx.orgId,
    ...l,
  }))

  const { error: linesError } = await ctx.supabase
    .from("payroll_run_lines")
    .insert(lineRows)

  if (linesError) {
    await ctx.supabase.from("payroll_runs").delete().eq("id", run.id)
    return { success: false, error: linesError.message }
  }

  return { success: true, runId: run.id }
}

export async function approvePayrollRun(
  input: ApprovePayrollRunInput
): Promise<ActionResult> {
  const parsed = approvePayrollRunSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { data: adminUser } = await ctx.supabase
    .from("users")
    .select("id")
    .eq("id", ctx.user.id)
    .maybeSingle()

  const { error } = await ctx.supabase
    .from("payroll_runs")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: adminUser?.id || null,
    })
    .eq("id", parsed.data.runId)
    .eq("status", "draft")

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deletePayrollRun(
  input: DeletePayrollRunInput
): Promise<ActionResult> {
  const parsed = deletePayrollRunSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { data: run } = await ctx.supabase
    .from("payroll_runs")
    .select("status")
    .eq("id", parsed.data.runId)
    .single()

  if (!run) return { success: false, error: "Run not found" }
  if (run.status !== "draft") {
    return { success: false, error: "Only draft runs can be deleted" }
  }

  const { error } = await ctx.supabase
    .from("payroll_runs")
    .delete()
    .eq("id", parsed.data.runId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function exportPayrollRunCsv(
  runId: string
): Promise<{ success: true; csv: string; filename: string } | { success: false; error: string }> {
  const ctx = await getAdminContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const detail = await getPayrollRunDetail(ctx.supabase, runId)
  if (!detail) return { success: false, error: "Run not found" }

  const headers = [
    "Employee Name",
    "Hourly Rate",
    "Total Hours",
    "Regular Hours",
    "Overtime Hours",
    "OT Multiplier",
    "Regular Pay",
    "Overtime Pay",
    "Gross Pay",
    "Shifts",
  ]

  const escape = (v: string) =>
    v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v

  const rows = detail.lines.map((l) =>
    [
      escape(l.employeeName),
      l.hourlyRate.toFixed(2),
      l.totalHours.toFixed(2),
      l.regularHours.toFixed(2),
      l.overtimeHours.toFixed(2),
      l.overtimeMultiplier.toFixed(2),
      l.regularPay.toFixed(2),
      l.overtimePay.toFixed(2),
      l.grossPay.toFixed(2),
      l.shifts.toString(),
    ].join(",")
  )

  const csv = [headers.join(","), ...rows].join("\n")
  const filename = `payroll-${detail.periodStart}-to-${detail.periodEnd}.csv`

  return { success: true, csv, filename }
}
