import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SignOutButton } from "@/components/shared/SignOutButton"

export const metadata = {
  title: "Overview - SpaceOps",
}

export default async function ClientOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand">
            Building Overview
          </h1>
          <p className="text-muted-foreground">Your cleaning service dashboard</p>
        </div>
        <SignOutButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Buildings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No buildings configured yet. Your service provider will set
            things up for you.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
