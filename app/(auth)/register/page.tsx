import { RegisterForm } from "./register-form"

export const metadata = { title: "Create Account - SpaceOps" }

export default function RegisterPage() {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-primary">SpaceOps</h1>
        <p className="text-muted-foreground mt-2">
          Create your organisation account
        </p>
      </div>
      <RegisterForm />
    </>
  )
}
