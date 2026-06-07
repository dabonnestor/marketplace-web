"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getOnboardStatus, onboardSeller } from "@/actions/seller"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function OnboardingBanner() {
  const [loading, setLoading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["onboard-status"],
    queryFn: () => getOnboardStatus(),
  })

  if (isLoading) {
    return (
      <div role="status" aria-label="Checking onboarding status">
        <Skeleton className="h-16 mb-4 w-full rounded-xl" />
      </div>
    )
  }

  if (
    !data ||
    !data.success ||
    (data.onboarded && data.chargesEnabled && data.payoutsEnabled)
  )
    return null

  async function handleClick() {
    setLoading(true)
    const result = await onboardSeller()
    if (result.success && "url" in result) {
      window.location.href = result.url
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 mb-6 flex items-center justify-between gap-4">
      <div>
        <h2 className="font-semibold">Set up payouts</h2>
        <p className="text-sm text-muted-foreground">
          Connect your Stripe account to receive payments for your listings.
        </p>
      </div>
      <Button onClick={handleClick} disabled={loading}>
        Set up payouts
      </Button>
    </div>
  )
}
