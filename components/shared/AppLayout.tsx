"use client"

import { AppSidebar } from "./AppSidebar"
import { AppHeader } from "./AppHeader"

interface AppLayoutProps {
  children: React.ReactNode
  mainClassName?: string
}

export function AppLayout({ children, mainClassName }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header with hamburger */}
        <AppHeader />

        <main className={mainClassName || "flex-1 p-6 lg:p-8"}>
          {children}
        </main>
      </div>
    </div>
  )
}
