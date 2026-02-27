import { InviteForm } from "./invite-form"

export const metadata = {
  title: "Invite User - SpaceOps",
}

export default function InviteUserPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Invite User</h1>
        <p className="text-muted-foreground">
          Send an invitation to a new team member
        </p>
      </div>
      <InviteForm />
    </div>
  )
}
