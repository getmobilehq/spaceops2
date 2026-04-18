import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import {
  getPayrollRuns,
  getPayrollSettings,
  getEmployeesForPayroll,
} from "@/lib/queries/payroll"
import { PayrollDashboard } from "./payroll-dashboard"

export const metadata = {
  title: "Payroll - SpaceOps",
}

export default async function PayrollPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const role = user.app_metadata?.role as string | undefined
  if (role !== "admin") return notFound()

  const [runs, settings, employees] = await Promise.all([
    getPayrollRuns(supabase),
    getPayrollSettings(supabase),
    getEmployeesForPayroll(supabase),
  ])

  const settingsMap = new Map(settings.map((s) => [s.userId, s]))

  const employeesWithSettings = employees.map((emp) => {
    const s = settingsMap.get(emp.id)
    return {
      ...emp,
      hourlyRate: s?.hourlyRate ?? 15.0,
      overtimeThresholdHours: s?.overtimeThresholdHours ?? 40.0,
      overtimeMultiplier: s?.overtimeMultiplier ?? 1.5,
      hasCustomSettings: !!s,
    }
  })

  return (
    <PayrollDashboard
      runs={runs}
      employees={employeesWithSettings}
      orgSlug={params.org}
    />
  )
}
