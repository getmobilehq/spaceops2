import { RoleGuard } from "@/components/shared/RoleGuard"
import { AppLayout } from "@/components/shared/AppLayout"
import { Toaster } from "@/components/ui/toaster"

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={["supervisor", "admin"]}>
      <AppLayout>
        {children}
      </AppLayout>
      <Toaster />
    </RoleGuard>
  )
}
