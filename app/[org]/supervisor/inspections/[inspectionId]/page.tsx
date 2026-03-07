import { createClient } from "@/lib/supabase/server"
import { getInspectionById } from "@/lib/queries/inspections"
import { StandaloneInspectionView } from "./standalone-inspection-view"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Inspection Detail - SpaceOps",
}

export default async function InspectionDetailPage({
  params,
}: {
  params: { org: string; inspectionId: string }
}) {
  const supabase = createClient()

  let inspection
  try {
    inspection = await getInspectionById(supabase, params.inspectionId)
  } catch {
    notFound()
  }

  if (!inspection) notFound()

  return (
    <StandaloneInspectionView
      inspection={inspection}
      orgSlug={params.org}
    />
  )
}
