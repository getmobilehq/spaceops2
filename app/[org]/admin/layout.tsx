import { RoleGuard } from "@/components/shared/RoleGuard"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { Toaster } from "@/components/ui/toaster"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="flex min-h-screen bg-surface">
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
        <Toaster />
      </div>
    </RoleGuard>
  )
}
