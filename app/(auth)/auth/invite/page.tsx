import { SetPasswordForm } from "./set-password-form"

export const metadata = {
  title: "Accept Invite - SpaceOps",
}

export default function InvitePage() {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-brand">SpaceOps</h1>
        <p className="text-muted-foreground mt-2">
          Welcome! Set your password to get started
        </p>
      </div>
      <SetPasswordForm mode="invite" />
    </>
  )
}
