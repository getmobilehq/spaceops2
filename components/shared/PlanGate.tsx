"use client"

import { usePlan } from "@/hooks/use-plan"
import { UpgradePrompt } from "./UpgradePrompt"
import type { Feature } from "@/lib/plans"

interface PlanGateProps {
  feature: Feature
  featureLabel: string
  description?: string
  children: React.ReactNode
}

export function PlanGate({
  feature,
  featureLabel,
  description,
  children,
}: PlanGateProps) {
  const { canAccess } = usePlan()

  if (!canAccess(feature)) {
    return (
      <UpgradePrompt feature={featureLabel} description={description} />
    )
  }

  return <>{children}</>
}
