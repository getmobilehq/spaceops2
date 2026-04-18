import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getPayrollRunDetail } from "@/lib/queries/payroll"
import { RunDetail } from "./run-detail"

export const metadata = {
  title: "Payroll Run - SpaceOps",
}

export default async function PayrollRunPage({
  params,
}: {
  params: { org: string; runId: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const role = user.app_metadata?.role as string | undefined
  if (role !== "admin") return notFound()

  const detail = await getPayrollRunDetail(supabase, params.runId)
  if (!detail) return notFound()

  return <RunDetail detail={detail} orgSlug={params.org} />
}
