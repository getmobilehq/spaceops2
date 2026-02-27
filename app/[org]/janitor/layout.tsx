import type { Viewport } from "next"
import { RoleGuard } from "@/components/shared/RoleGuard"
import { Toaster } from "@/components/ui/toaster"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
}

export default function JanitorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={["janitor"]}>
      <div className="min-h-screen bg-surface pb-20">
        <main className="px-4 pt-4 pb-4 max-w-lg mx-auto">
          {children}
        </main>
        <Toaster />
      </div>
    </RoleGuard>
  )
}
