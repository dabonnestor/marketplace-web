"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { createOrder } from "@/actions/orders"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Listing } from "@/lib/api/types"

function formatCurrency(amount: string): string {
  return `$${parseFloat(amount).toFixed(2)}`
}

function calcPlatformFee(price: string): string {
  return (parseFloat(price) * 0.05).toFixed(2)
}

function calcTotal(
  price: string,
  shipping: string,
  platformFee: string,
): string {
  return (
    parseFloat(price) +
    parseFloat(shipping) +
    parseFloat(platformFee)
  ).toFixed(2)
}

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

  useEffect(() => {
    if (currentUserId === null && listing.status !== "sold") {
      router.push(`/login?redirect=/listings/${listing.id}/confirm`)
    }
  }, [currentUserId, listing.id, listing.status, router])

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

  const [isPending, setIsPending] = useState(false)

  async function handleConfirm() {
    setIsPending(true)
    const result = await createOrder(listing.id)
    setIsPending(false)

    if (result.success && result.order) {
      toast.success("Order placed successfully")
      router.push(`/orders/${result.order.id}`)
    } else {
      toast.error(result.error || "Failed to create order")
    }
  }

  const platformFee = calcPlatformFee(listing.price)
  const total = calcTotal(listing.price, listing.shippingCost, platformFee)

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
          Review the details before placing your order.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{listing.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <PriceRow label="Subtotal" amount={formatCurrency(listing.price)} />
          <PriceRow
            label="Shipping"
            amount={formatCurrency(listing.shippingCost)}
          />
          <PriceRow
            label="Platform fee (5%)"
            amount={formatCurrency(platformFee)}
          />
          <Separator />
          <PriceRow label="Total" amount={formatCurrency(total)} bold />
        </CardContent>
      </Card>

      <Button onClick={handleConfirm} disabled={isPending} className="w-full">
        {isPending ? "Confirming..." : "Confirm Purchase"}
      </Button>
    </div>
  )
}
