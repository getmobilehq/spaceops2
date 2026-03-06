import { useOrg } from "@/components/shared/OrgProvider"
import {
  canAccess,
  getPlanLimits,
  type Feature,
  type PlanType,
} from "@/lib/plans"

export function usePlan() {
  const { plan } = useOrg()

  return {
    plan: plan as PlanType,
    limits: getPlanLimits(plan as PlanType),
    canAccess: (feature: Feature) => canAccess(feature, plan as PlanType),
    isFreePlan: plan === "free",
  }
}
