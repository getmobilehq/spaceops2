import { ResetPasswordForm } from "./reset-password-form"

export const metadata = {
  title: "Reset Password - SpaceOps",
}

export default function ResetPasswordPage() {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-brand">SpaceOps</h1>
        <p className="text-muted-foreground mt-2">Reset your password</p>
      </div>
      <ResetPasswordForm />
    </>
  )
}
