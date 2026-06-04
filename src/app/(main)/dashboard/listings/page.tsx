import { Suspense } from "react"
import { MyListings } from "@/components/listings/my-listings"
import { OnboardingBanner } from "@/components/listings/onboarding-banner"

export default function MyListingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Listings</h1>
      <Suspense>
        <OnboardingBanner />
      </Suspense>
      <Suspense>
        <MyListings />
      </Suspense>
    </div>
  )
}
