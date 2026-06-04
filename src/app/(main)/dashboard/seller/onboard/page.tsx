"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { getOnboardStatus, onboardSeller } from "@/actions/seller"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function SellerOnboardPage() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")
  const [retrying, setRetrying] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["onboard-status"],
    queryFn: () => getOnboardStatus(),
  })

  if (isLoading) {
    return (
      <div role="status" aria-label="Checking onboarding status">
        <Skeleton className="h-48 w-full max-w-md mx-auto rounded-xl" />
      </div>
    )
  }

  if (!data || !data.success) return null

  if (data.onboarded && !errorParam) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-4 text-green-600">&#10003;</div>
        <h1 className="text-2xl font-bold mb-2">You&apos;re ready to sell</h1>
        <p className="text-muted-foreground mb-6">
          Your Stripe account is connected and ready to receive payments.
        </p>
        <Button asChild>
          <Link href="/dashboard/listings">Go to dashboard</Link>
        </Button>
      </div>
    )
  }

  // Error state: either error param present or not yet onboarded
  async function handleRetry() {
    setRetrying(true)
    const result = await onboardSeller()
    if (result.success && "url" in result) {
      window.location.href = result.url
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-4 text-destructive">&#10007;</div>
      <h1 className="text-2xl font-bold mb-2">Onboarding failed</h1>
      <p className="text-muted-foreground mb-6">
        {errorParam ?? "Something went wrong connecting your Stripe account."}
      </p>
      <Button onClick={handleRetry} disabled={retrying}>
        Try again
      </Button>
    </div>
  )
}
