import { RoleGuard } from "@/components/shared/RoleGuard"
import { Toaster } from "@/components/ui/toaster"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={["client"]}>
      <div className="min-h-screen bg-surface">
        <main className="p-6 lg:p-8 max-w-6xl mx-auto">
          {children}
        </main>
        <Toaster />
      </div>
    </RoleGuard>
  )
}
