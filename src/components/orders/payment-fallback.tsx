import { useState } from "react"
import { Button } from "@/components/ui/button"
import { StripePaymentForm } from "@/components/checkout/stripe-payment-form"

interface PaymentFallbackProps {
  clientSecret: string
  orderId: string
  onSuccess: () => void
}

export function PaymentFallback({ clientSecret, orderId, onSuccess }: PaymentFallbackProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  if (showPaymentForm) {
    return (
      <StripePaymentForm
        clientSecret={clientSecret}
        orderId={orderId}
        onSuccess={onSuccess}
      />
    )
  }

  return (
    <div className="space-y-2">
      <Button onClick={() => setShowPaymentForm(true)} className="w-full">
        Complete Payment
      </Button>
    </div>
  )
}
