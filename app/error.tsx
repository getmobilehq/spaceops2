"use client"

import { Button } from "@/components/ui/button"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand">
          Something went wrong
        </h1>
        <p className="text-muted-foreground text-sm max-w-md">
          An unexpected error occurred. Please try again.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  )
}
