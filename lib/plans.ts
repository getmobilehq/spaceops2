export type PlanType = "free" | "pro" | "enterprise"

export type Feature =
  | "ai_vectorisation"
  | "ai_reports"
  | "unlimited_buildings"
  | "unlimited_seats"
  | "api_access"

interface PlanLimits {
  buildings: number // 0 = unlimited
  seats: number // 0 = unlimited
  features: Feature[]
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    buildings: 1,
    seats: 5,
    features: [],
  },
  pro: {
    buildings: 0,
    seats: 0,
    features: [
      "ai_vectorisation",
      "ai_reports",
      "unlimited_buildings",
      "unlimited_seats",
    ],
  },
  enterprise: {
    buildings: 0,
    seats: 0,
    features: [
      "ai_vectorisation",
      "ai_reports",
      "unlimited_buildings",
      "unlimited_seats",
      "api_access",
    ],
  },
}

export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free
}

export function canAccess(feature: Feature, plan: PlanType): boolean {
  return PLAN_LIMITS[plan]?.features.includes(feature) ?? false
}

export function planFromPriceId(priceId: string): PlanType {
  const proPrices = [
    process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
    process.env.STRIPE_PRICE_ID_PRO_YEARLY,
  ]
  const enterprisePrices = [
    process.env.STRIPE_PRICE_ID_ENTERPRISE_MONTHLY,
    process.env.STRIPE_PRICE_ID_ENTERPRISE_YEARLY,
  ]

  if (proPrices.includes(priceId)) return "pro"
  if (enterprisePrices.includes(priceId)) return "enterprise"
  return "free"
}
