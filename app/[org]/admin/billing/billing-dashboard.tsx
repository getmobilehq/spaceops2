"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  createCheckoutSession,
  createCustomerPortalSession,
} from "@/actions/billing"
import { getPlanLimits, type PlanType } from "@/lib/plans"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, CreditCard, Zap, Building2, Users, Cpu, FileText, Code } from "lucide-react"
import type { Tables } from "@/lib/supabase/types"

interface BillingDashboardProps {
  plan: PlanType
  subscription: Tables<"subscriptions"> | null
  buildingCount: number
  userCount: number
  aiVectorisations: number
  aiReports: number
  apiCalls: number
}

const PRICE_IDS = {
  pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY || "",
  pro_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_YEARLY || "",
  enterprise_monthly:
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE_MONTHLY || "",
  enterprise_yearly:
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE_YEARLY || "",
}

export function BillingDashboard({
  plan,
  subscription,
  buildingCount,
  userCount,
  aiVectorisations,
  aiReports,
  apiCalls,
}: BillingDashboardProps) {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const limits = getPlanLimits(plan)
  const isFreePlan = plan === "free"

  // Show success/canceled banners
  if (searchParams.get("success") === "true") {
    toast({ title: "Subscription activated", description: "Welcome to your new plan!" })
    router.replace(window.location.pathname)
  }
  if (searchParams.get("canceled") === "true") {
    toast({
      title: "Checkout canceled",
      description: "No changes were made to your subscription.",
      variant: "destructive",
    })
    router.replace(window.location.pathname)
  }

  async function handleCheckout(priceId: string) {
    setIsLoading(priceId)
    const result = await createCheckoutSession({ priceId })
    if (result.success) {
      window.location.href = result.url
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsLoading(null)
  }

  async function handleManageSubscription() {
    setIsLoading("portal")
    const result = await createCustomerPortalSession()
    if (result.success) {
      window.location.href = result.url
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsLoading(null)
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Plan</CardTitle>
            <Badge
              variant={isFreePlan ? "secondary" : "default"}
              className="capitalize"
            >
              {plan}
            </Badge>
          </div>
          {subscription && (
            <CardDescription>
              {subscription.cancel_at_period_end
                ? `Cancels on ${new Date(subscription.current_period_end).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
                : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Buildings</p>
                <p className="text-xs text-muted-foreground">
                  {buildingCount} / {limits.buildings === 0 ? "Unlimited" : limits.buildings}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Users</p>
                <p className="text-xs text-muted-foreground">
                  {userCount} / {limits.seats === 0 ? "Unlimited" : limits.seats}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Cpu className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">AI Vectorisations</p>
                <p className="text-xs text-muted-foreground">
                  {aiVectorisations} this period
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">AI Reports</p>
                <p className="text-xs text-muted-foreground">
                  {aiReports} this period
                </p>
              </div>
            </div>
            {plan === "enterprise" && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Code className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">API Calls</p>
                  <p className="text-xs text-muted-foreground">
                    {apiCalls} this period
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        {!isFreePlan && (
          <CardFooter>
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={isLoading === "portal"}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {isLoading === "portal"
                ? "Loading..."
                : "Manage Subscription"}
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Upgrade Cards */}
      {isFreePlan && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Pro Plan */}
          <Card className="border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle>Pro</CardTitle>
              </div>
              <CardDescription>
                For growing cleaning operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Unlimited buildings
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Unlimited users
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  AI floor plan vectorisation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  AI report generation
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => handleCheckout(PRICE_IDS.pro_monthly)}
                disabled={!!isLoading}
              >
                {isLoading === PRICE_IDS.pro_monthly
                  ? "Loading..."
                  : "Monthly"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleCheckout(PRICE_IDS.pro_yearly)}
                disabled={!!isLoading}
              >
                {isLoading === PRICE_IDS.pro_yearly
                  ? "Loading..."
                  : "Yearly (Save 17%)"}
              </Button>
            </CardFooter>
          </Card>

          {/* Enterprise Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <CardTitle>Enterprise</CardTitle>
              </div>
              <CardDescription>
                For large-scale operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Everything in Pro
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  API access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Custom integrations
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => handleCheckout(PRICE_IDS.enterprise_monthly)}
                disabled={!!isLoading}
              >
                {isLoading === PRICE_IDS.enterprise_monthly
                  ? "Loading..."
                  : "Monthly"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleCheckout(PRICE_IDS.enterprise_yearly)}
                disabled={!!isLoading}
              >
                {isLoading === PRICE_IDS.enterprise_yearly
                  ? "Loading..."
                  : "Yearly (Save 17%)"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
