import { ClientForm } from "./client-form"

export const metadata = {
  title: "Add Client - SpaceOps",
}

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Add Client</h1>
        <p className="text-muted-foreground">
          Create a new building owner client
        </p>
      </div>
      <ClientForm />
    </div>
  )
}
