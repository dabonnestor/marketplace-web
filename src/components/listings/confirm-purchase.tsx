"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createOrder, fetchOrder } from "@/actions/orders"
import { StripePaymentForm } from "@/components/checkout/stripe-payment-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Listing, Order } from "@/lib/api/types"
import { formatCurrency } from "@/lib/display-utils"

function PriceRow({
  label,
  amount,
  bold,
}: {
  label: string
  amount: string
  bold?: boolean
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className={bold ? "font-semibold" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={bold ? "font-semibold" : ""}>{amount}</span>
    </div>
  )
}

export function ConfirmPurchase({
  listing,
  currentUserId,
}: {
  listing: Listing
  currentUserId: string | null
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const orderIdParam = searchParams.get("orderId")

  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (currentUserId === null && listing.status !== "sold") {
      router.push(`/login?redirect=/listings/${listing.id}/confirm`)
    }
  }, [currentUserId, listing.id, listing.status, router])

  const { mutate: handleCreateOrder, isPending: isCreating } = useMutation({
    mutationFn: () => createOrder(listing.id),
    onSuccess: (result) => {
      if (result.success && result.order) {
        queryClient.invalidateQueries({ queryKey: ["purchases"] })
        setOrder(result.order)
        router.replace(`?orderId=${result.order.id}`)
      } else {
        toast.error(result.error || "Failed to create order")
      }
    },
  })

  if (listing.status === "sold") {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <h1 className="text-xl font-semibold">
          This listing is no longer available
        </h1>
        <p className="text-muted-foreground">
          It looks like someone already purchased this item.
        </p>
        <Button asChild variant="outline">
          <Link href="/listings">Browse other listings</Link>
        </Button>
      </div>
    )
  }

  const { data: orderResult } = useQuery({
    queryKey: ["order", orderIdParam],
    queryFn: () => fetchOrder(orderIdParam!),
    enabled: !!orderIdParam,
  })

  useEffect(() => {
    if (!orderResult) return
    if (orderResult.success && orderResult.order) {
      if (orderResult.order.status === "pending") {
        setOrder(orderResult.order)
      } else {
        router.push(`/orders/${orderResult.order.id}`)
      }
    } else {
      toast.error(orderResult.error || "Failed to fetch order")
      router.replace(window.location.pathname)
    }
  }, [orderResult, router])

  // Step 2: server-computed price breakdown + StripePaymentForm
  if (order) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Link
          href={`/listings/${listing.id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to listing
        </Link>

        <div>
          <h1 className="mt-4 text-2xl font-bold">Complete your payment</h1>
          <p className="text-muted-foreground mt-1">
            Review the final price and enter your card details.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{listing.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <PriceRow
              label="Subtotal"
              amount={formatCurrency(order.subtotal)}
            />
            <PriceRow
              label="Shipping"
              amount={formatCurrency(order.shippingCost)}
            />
            <PriceRow
              label="Platform fee"
              amount={formatCurrency(order.platformFee)}
            />
            <Separator />
            <PriceRow label="Total" amount={formatCurrency(order.total)} bold />
          </CardContent>
        </Card>

        {order.clientSecret && (
          <StripePaymentForm
            clientSecret={order.clientSecret}
            orderId={order.id}
            onSuccess={() => {
              queryClient.removeQueries({ queryKey: ["order", order.id] })
              router.push(`/orders/${order.id}`)
            }}
          />
        )}
      </div>
    )
  }

  // Step 1: listing summary + proceed button
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link
        href={`/listings/${listing.id}`}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; Back to listing
      </Link>

      <div>
        <h1 className="mt-4 text-2xl font-bold">Confirm your purchase</h1>
        <p className="text-muted-foreground mt-1">
          Review the details before proceeding to payment.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{listing.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <PriceRow
            label="Price"
            amount={formatCurrency(listing.price)}
          />
          <PriceRow
            label="Shipping"
            amount={formatCurrency(listing.shippingCost)}
          />
          <p className="text-sm text-muted-foreground">
            10% platform fee will be added at checkout.
          </p>
        </CardContent>
      </Card>

      <Button
        onClick={() => handleCreateOrder()}
        disabled={isCreating}
        className="w-full"
      >
        {isCreating ? "Creating order..." : "Proceed to Payment"}
      </Button>
    </div>
  )
}
