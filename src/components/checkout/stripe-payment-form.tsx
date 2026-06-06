"use client"

import { useState } from "react"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import {
  loadStripe,
  type Stripe,
  type StripeElementsOptions,
} from "@stripe/stripe-js"
import { toast } from "sonner"
import { payOrder } from "@/actions/orders"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const stripeAppearance: StripeElementsOptions["appearance"] = {
  theme: "none",
  variables: {
    colorBackground: "#09090b",
    colorText: "#fafafa",
    colorPrimary: "#fafafa",
    colorDanger: "#ef4444",
    borderRadius: "0.75rem",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      backgroundColor: "transparent",
      border: "1px solid #262638",
      boxShadow: "none",
    },
    ".Input:focus": {
      border: "1px solid #d4d4e8",
      boxShadow: "0 0 0 1px #d4d4e8",
    },
    ".Label": {
      color: "#a1a1aa",
      fontSize: "0.875rem",
    },
    ".Tab": {
      color: "#a1a1aa",
      backgroundColor: "transparent",
    },
    ".Tab--selected": {
      color: "#fafafa",
      backgroundColor: "#262638",
    },
  },
}

let stripePromise: Promise<Stripe | null> | null = null

function getStripe() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) {
      console.error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")
      return Promise.resolve(null)
    }
    stripePromise = loadStripe(key)
  }
  return stripePromise
}

interface StripePaymentFormProps {
  clientSecret: string
  orderId: string
  onSuccess: () => void
}

function PaymentFormInner({ orderId, onSuccess }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsProcessing(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    })

    if (error) {
      toast.error(error.message ?? "Payment failed")
      setIsProcessing(false)
      return
    }

    const result = await payOrder(orderId)
    setIsProcessing(false)

    if (result.success) {
      onSuccess()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="mt-6">
          <form onSubmit={handleSubmit}>
            <PaymentElement />
            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className="w-full mt-2"
            >
              {isProcessing ? "Processing payment..." : `Pay`}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

export function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret: props.clientSecret,
        appearance: stripeAppearance,
      }}
    >
      <PaymentFormInner {...props} />
    </Elements>
  )
}
