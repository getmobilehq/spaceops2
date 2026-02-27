import { RoleGuard } from "@/components/shared/RoleGuard"
import { Toaster } from "@/components/ui/toaster"

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={["supervisor", "admin"]}>
      <div className="min-h-screen bg-surface">
        <main className="p-6 lg:p-8">
          {children}
        </main>
        <Toaster />
      </div>
    </RoleGuard>
  )
}
