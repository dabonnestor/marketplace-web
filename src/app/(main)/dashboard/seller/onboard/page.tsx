import { Suspense } from "react"
import { OnboardingContent } from "@/components/listings/onboarding-content"

export default function SellerOnboardPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  )
}
