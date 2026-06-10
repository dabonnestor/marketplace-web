"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { getOnboardStatus, onboardSeller } from "@/actions/seller"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function OnboardingBanner() {
  const { data, isLoading } = useQuery({
    queryKey: ["onboard-status"],
    queryFn: () => getOnboardStatus(),
  })

  const { mutate: handleClick, isPending } = useMutation({
    mutationFn: () => onboardSeller(),
    onSuccess: (result) => {
      if (result.success && "url" in result) {
        window.location.href = result.url
      }
    },
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

  return (
    <div className="rounded-xl border bg-card p-6 mb-6 flex items-center justify-between gap-4">
      <div>
        <h2 className="font-semibold">Set up payouts</h2>
        <p className="text-sm text-muted-foreground">
          Connect your Stripe account to receive payments for your listings.
        </p>
      </div>
      <Button onClick={() => handleClick()} disabled={isPending}>
        Set up payouts
      </Button>
    </div>
  )
}
