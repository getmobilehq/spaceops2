import { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export interface PayrollSettingRow {
  id: string
  userId: string
  firstName: string
  lastName: string
  role: string
  hourlyRate: number
  overtimeThresholdHours: number
  overtimeMultiplier: number
}

export interface PayrollRunRow {
  id: string
  periodStart: string
  periodEnd: string
  status: string
  totalGrossPay: number
  employeeCount: number
  notes: string | null
  createdAt: string
  createdByName: string | null
}

export interface PayrollRunLineRow {
  id: string
  userId: string
  employeeName: string
  hourlyRate: number
  totalHours: number
  regularHours: number
  overtimeHours: number
  overtimeMultiplier: number
  regularPay: number
  overtimePay: number
  grossPay: number
  shifts: number
}

export interface PayrollRunDetail {
  id: string
  periodStart: string
  periodEnd: string
  status: string
  totalGrossPay: number
  employeeCount: number
  notes: string | null
  createdAt: string
  createdByName: string | null
  approvedAt: string | null
  approvedByName: string | null
  lines: PayrollRunLineRow[]
}

export interface PayrollEmployee {
  id: string
  firstName: string
  lastName: string
  role: string
}

export interface AttendanceHoursRow {
  userId: string
  name: string
  totalMinutes: number
  hoursWorked: number
  shifts: number
}

export async function getPayrollSettings(
  supabase: SupabaseClient<Database>
): Promise<PayrollSettingRow[]> {
  const { data, error } = await supabase
    .from("payroll_settings")
    .select(
      "id, user_id, hourly_rate, overtime_threshold_hours, overtime_multiplier, users!payroll_settings_user_id_fkey(first_name, last_name, role)"
    )
    .order("created_at")

  if (error) throw error

  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    firstName: row.users?.first_name || "",
    lastName: row.users?.last_name || "",
    role: row.users?.role || "",
    hourlyRate: Number(row.hourly_rate),
    overtimeThresholdHours: Number(row.overtime_threshold_hours),
    overtimeMultiplier: Number(row.overtime_multiplier),
  }))
}

export async function getPayrollRuns(
  supabase: SupabaseClient<Database>
): Promise<PayrollRunRow[]> {
  const { data, error } = await supabase
    .from("payroll_runs")
    .select(
      "id, period_start, period_end, status, total_gross_pay, employee_count, notes, created_at, created_by, users!payroll_runs_created_by_fkey(first_name, last_name)"
    )
    .order("period_start", { ascending: false })

  if (error) throw error

  return (data || []).map((row: any) => ({
    id: row.id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    status: row.status,
    totalGrossPay: Number(row.total_gross_pay),
    employeeCount: row.employee_count,
    notes: row.notes,
    createdAt: row.created_at,
    createdByName: row.users
      ? `${row.users.first_name} ${row.users.last_name}`
      : null,
  }))
}

export async function getPayrollRunDetail(
  supabase: SupabaseClient<Database>,
  runId: string
): Promise<PayrollRunDetail | null> {
  const { data: run, error: runError } = await supabase
    .from("payroll_runs")
    .select(
      "id, period_start, period_end, status, total_gross_pay, employee_count, notes, created_at, approved_at, created_by, approved_by, creator:users!payroll_runs_created_by_fkey(first_name, last_name), approver:users!payroll_runs_approved_by_fkey(first_name, last_name)"
    )
    .eq("id", runId)
    .single()

  if (runError || !run) return null

  const { data: lines, error: linesError } = await supabase
    .from("payroll_run_lines")
    .select(
      "id, user_id, employee_name, hourly_rate, total_hours, regular_hours, overtime_hours, overtime_multiplier, regular_pay, overtime_pay, gross_pay, shifts"
    )
    .eq("payroll_run_id", runId)
    .order("employee_name")

  if (linesError) throw linesError

  const r = run as any

  return {
    id: r.id,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    status: r.status,
    totalGrossPay: Number(r.total_gross_pay),
    employeeCount: r.employee_count,
    notes: r.notes,
    createdAt: r.created_at,
    createdByName: r.creator
      ? `${r.creator.first_name} ${r.creator.last_name}`
      : null,
    approvedAt: r.approved_at,
    approvedByName: r.approver
      ? `${r.approver.first_name} ${r.approver.last_name}`
      : null,
    lines: (lines || []).map((l: any) => ({
      id: l.id,
      userId: l.user_id,
      employeeName: l.employee_name,
      hourlyRate: Number(l.hourly_rate),
      totalHours: Number(l.total_hours),
      regularHours: Number(l.regular_hours),
      overtimeHours: Number(l.overtime_hours),
      overtimeMultiplier: Number(l.overtime_multiplier),
      regularPay: Number(l.regular_pay),
      overtimePay: Number(l.overtime_pay),
      grossPay: Number(l.gross_pay),
      shifts: l.shifts,
    })),
  }
}

export async function getEmployeesForPayroll(
  supabase: SupabaseClient<Database>
): Promise<PayrollEmployee[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, role")
    .in("role", ["janitor", "supervisor"])
    .eq("is_active", true)
    .order("first_name")

  if (error) throw error

  return (data || []).map((u) => ({
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    role: u.role,
  }))
}

export async function getAttendanceHoursForPayroll(
  supabase: SupabaseClient<Database>,
  periodStart: string,
  periodEnd: string
): Promise<AttendanceHoursRow[]> {
  const { data, error } = await supabase
    .from("attendance_records")
    .select(
      "user_id, clock_in_at, clock_out_at, users!attendance_records_user_id_fkey(first_name, last_name)"
    )
    .not("clock_out_at", "is", null)
    .gte("date", periodStart)
    .lte("date", periodEnd)

  if (error) throw error

  const map = new Map<
    string,
    { name: string; totalMinutes: number; shifts: number }
  >()

  for (const record of data || []) {
    if (!record.clock_out_at) continue
    const user = record.users as { first_name: string; last_name: string } | null
    if (!user) continue

    const minutes =
      (new Date(record.clock_out_at).getTime() -
        new Date(record.clock_in_at).getTime()) /
      60000

    const key = record.user_id
    if (!map.has(key)) {
      map.set(key, {
        name: `${user.first_name} ${user.last_name}`,
        totalMinutes: 0,
        shifts: 0,
      })
    }
    const entry = map.get(key)!
    entry.totalMinutes += minutes
    entry.shifts += 1
  }

  return Array.from(map.entries()).map(([userId, j]) => ({
    userId,
    name: j.name,
    totalMinutes: Math.round(j.totalMinutes),
    hoursWorked: Math.round((j.totalMinutes / 60) * 100) / 100,
    shifts: j.shifts,
  }))
}
