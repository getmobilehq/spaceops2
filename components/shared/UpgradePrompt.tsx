"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useOrg } from "@/components/shared/OrgProvider"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"

interface UpgradePromptProps {
  feature: string
  description?: string
}

export function UpgradePrompt({ feature, description }: UpgradePromptProps) {
  const { orgSlug } = useOrg()
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const role = segments[1] || "admin"

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <Zap className="h-10 w-10 text-muted-foreground mb-3" />
      <h3 className="text-lg font-semibold">Upgrade to unlock {feature}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-md">
          {description}
        </p>
      )}
      <Button asChild className="mt-4">
        <Link href={`/${orgSlug}/${role === "admin" ? "admin" : "admin"}/billing`}>
          View Plans
        </Link>
      </Button>
    </div>
  )
}
