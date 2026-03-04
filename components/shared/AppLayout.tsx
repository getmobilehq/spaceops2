"use client"

import { AppSidebar } from "./AppSidebar"
import { AppHeader } from "./AppHeader"
import { SidebarProvider } from "./SidebarProvider"

interface AppLayoutProps {
  children: React.ReactNode
  mainClassName?: string
}

export function AppLayout({ children, mainClassName }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <AppSidebar />
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className={mainClassName || "flex-1 p-6"}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
