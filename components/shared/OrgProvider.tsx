"use client"

import { createContext, useContext } from "react"

interface OrgContextValue {
  orgId: string
  orgSlug: string
  orgName: string
  passThreshold: number
  orgLogoUrl: string | null
}

const OrgContext = createContext<OrgContextValue | null>(null)

export function OrgProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: OrgContextValue
}) {
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg(): OrgContextValue {
  const context = useContext(OrgContext)
  if (!context) {
    throw new Error("useOrg must be used within an OrgProvider")
  }
  return context
}
