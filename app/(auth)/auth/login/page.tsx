import { LoginForm } from "./login-form"

export const metadata = {
  title: "Sign In - SpaceOps",
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string }
}) {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-brand">SpaceOps</h1>
        <p className="text-muted-foreground mt-2">Sign in to your account</p>
      </div>
      {searchParams.error === "no_role" && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm text-center">
          Your account has not been assigned a role. Please contact your
          administrator.
        </div>
      )}
      <LoginForm redirectTo={searchParams.next} />
    </>
  )
}
