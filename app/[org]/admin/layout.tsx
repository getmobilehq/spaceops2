import { RoleGuard } from "@/components/shared/RoleGuard"
import { AppLayout } from "@/components/shared/AppLayout"
import { Toaster } from "@/components/ui/toaster"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AppLayout>
        {children}
      </AppLayout>
      <Toaster />
    </RoleGuard>
  )
}
