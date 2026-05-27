"use client"

export default function ListingDetailError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <div className="max-w-3xl mx-auto p-4 text-center space-y-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <button
        onClick={() => unstable_retry()}
        className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
      >
        Try again
      </button>
    </div>
  )
}
