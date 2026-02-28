"use client"

import { AppSidebar } from "./AppSidebar"
import { AppHeader } from "./AppHeader"
import { NotificationBell } from "./NotificationBell"

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

        {/* Desktop topbar (notification bell) */}
        <div className="hidden lg:flex items-center justify-end border-b bg-white px-8 py-2">
          <NotificationBell />
        </div>

        <main className={mainClassName || "flex-1 p-6 lg:p-8"}>
          {children}
        </main>
      </div>
    </div>
  )
}
