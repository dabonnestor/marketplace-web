"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function DashboardListingsError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return <ErrorBoundary error={error} unstable_retry={unstable_retry} />
}
