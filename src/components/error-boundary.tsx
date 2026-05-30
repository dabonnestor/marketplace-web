"use client"

import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  unstable_retry: () => void
}

export function ErrorBoundary({ error, unstable_retry }: ErrorBoundaryProps) {
  return (
    <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground">
        {error.message || "An unexpected error occurred"}
      </p>
      <Button onClick={() => unstable_retry()}>Try again</Button>
    </div>
  )
}
