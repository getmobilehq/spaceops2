import { SetPasswordForm } from "../invite/set-password-form"

export const metadata = {
  title: "New Password - SpaceOps",
}

export default function NewPasswordPage() {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-brand">SpaceOps</h1>
        <p className="text-muted-foreground mt-2">Set your new password</p>
      </div>
      <SetPasswordForm mode="reset" />
    </>
  )
}
