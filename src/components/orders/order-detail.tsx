"use client"

import { useEffect, useState, Fragment } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { updateOrderStatus, cancelOrder, refundOrder } from "@/actions/orders"
import { StripePaymentForm } from "@/components/checkout/stripe-payment-form"
import {
  getValidTransitions,
  statusColor,
  statusLabel,
} from "@/lib/order-utils"
import { cn } from "@/lib/utils"
import { formatCurrency, badgeClasses, NoImage } from "@/lib/display-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type {
  Order,
  Listing,
  OrderStatus,
  OrderStatusTransition,
} from "@/lib/api/types"

const STATUS_STEPS: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "completed",
]

function actionLabel(status: OrderStatus): string {
  switch (status) {
    case "paid":
      return "Mark as Paid"
    case "shipped":
      return "Mark as Shipped"
    case "delivered":
      return "Mark as Delivered"
    case "completed":
      return "Mark as Completed"
    default:
      return `Mark as ${statusLabel(status)}`
  }
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

function StatusProgress({ status }: { status: OrderStatus }) {
  const currentIdx = STATUS_STEPS.indexOf(status)
  const isTerminal = currentIdx === -1

  return (
    <div className="flex items-center gap-1">
      {STATUS_STEPS.map((step, i) => {
        const isReached = !isTerminal && i <= currentIdx
        const isCurrent = i === currentIdx
        const isFuture = !isReached

        return (
          <Fragment key={step}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  isReached && "bg-green-500 text-white",
                  isFuture && "bg-muted text-muted-foreground",
                )}
              >
                {isReached ? "✓" : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  isReached && "text-green-600 font-semibold",
                  isFuture && "text-muted-foreground",
                )}
              >
                {statusLabel(step)}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 mt-[-1.25rem]",
                  !isTerminal && i < currentIdx ? "bg-green-500" : "bg-border",
                )}
              />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

interface OrderDetailProps {
  order: Order
  listing: Listing
  currentUserId: string | null
}

export function OrderDetail({
  order,
  listing,
  currentUserId,
}: OrderDetailProps) {
  const router = useRouter()
  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelPending, setCancelPending] = useState(false)
  const [showRefundConfirm, setShowRefundConfirm] = useState(false)
  const [refundPending, setRefundPending] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  useEffect(() => {
    if (currentUserId === null) {
      router.push(`/login?redirect=/orders/${order.id}`)
    }
  }, [currentUserId, order.id, router])

  const role =
    currentUserId === order.buyerId
      ? "buyer"
      : currentUserId === order.sellerId
        ? "seller"
        : "none"

  const validTransitions = getValidTransitions(order.status, role)

  const canCancel =
    role === "buyer" && (order.status === "pending" || order.status === "paid")
  const canRefund =
    role === "buyer" &&
    (order.status === "paid" ||
      order.status === "shipped" ||
      order.status === "delivered")

  const canCompletePayment =
    role === "buyer" && order.status === "pending" && !!order.clientSecret

  const terminalStatuses: OrderStatus[] = [
    "completed",
    "cancelled",
    "expired",
    "refunded",
  ]
  const isTerminal = terminalStatuses.includes(order.status)

  useEffect(() => {
    if (isTerminal) return
    const interval = setInterval(() => {
      router.refresh()
    }, 30000)
    return () => clearInterval(interval)
  }, [isTerminal, router])

  async function handleAction(status: OrderStatus) {
    setIsPending(true)
    const result = await updateOrderStatus(order.id, {
      status,
    } as OrderStatusTransition)
    setIsPending(false)
    setTargetStatus(null)

    if (result.success) {
      toast.success(`Order marked as ${statusLabel(status)}`)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to update order status")
    }
  }

  async function handleCancel() {
    setCancelPending(true)
    const result = await cancelOrder(order.id)
    setCancelPending(false)
    setShowCancelConfirm(false)

    if (result.success) {
      toast.success("Order cancelled")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to cancel order")
    }
  }

  async function handleRefund() {
    setRefundPending(true)
    const result = await refundOrder(order.id)
    setRefundPending(false)
    setShowRefundConfirm(false)

    if (result.success) {
      toast.success("Order refunded")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to refund order")
    }
  }

  const badgeColor = statusColor(order.status)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/dashboard/purchases"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block"
      >
        &larr; Back to purchases
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">{listing.title}</h1>
          <p className="text-sm text-muted-foreground">Order #{order.id}</p>
        </div>
        <div
          className={cn(
            "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold shrink-0",
            badgeClasses[badgeColor],
          )}
        >
          {statusLabel(order.status)}
        </div>
      </div>

      {listing.images.length > 0 ? (
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="w-full rounded-xl object-cover aspect-video"
        />
      ) : (
        <NoImage className="aspect-video rounded-xl" />
      )}

      <StatusProgress status={order.status} />

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <PriceRow label="Subtotal" amount={formatCurrency(order.subtotal)} />
          <PriceRow
            label="Shipping"
            amount={formatCurrency(order.shippingCost)}
          />
          <PriceRow
            label="Platform fee (5%)"
            amount={formatCurrency(order.platformFee)}
          />
          <Separator />
          <PriceRow label="Total" amount={formatCurrency(order.total)} bold />
        </CardContent>
      </Card>

      {validTransitions.length > 0 && (
        <div className="space-y-2">
          {validTransitions.map((s) => (
            <Button
              key={s}
              onClick={() => setTargetStatus(s)}
              className="w-full"
            >
              {actionLabel(s)}
            </Button>
          ))}
        </div>
      )}

      {canCompletePayment && !showPaymentForm && (
        <div className="space-y-2">
          <Button
            onClick={() => setShowPaymentForm(true)}
            className="w-full"
          >
            Complete Payment
          </Button>
        </div>
      )}

      {canCompletePayment && showPaymentForm && (
        <StripePaymentForm
          clientSecret={order.clientSecret!}
          orderId={order.id}
          onSuccess={() => router.refresh()}
        />
      )}

      {canCancel && (
        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={() => setShowCancelConfirm(true)}
            className="w-full"
          >
            Cancel Order
          </Button>
        </div>
      )}

      {canRefund && (
        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={() => setShowRefundConfirm(true)}
            className="w-full"
          >
            Refund Order
          </Button>
        </div>
      )}

      <Dialog
        open={!!targetStatus}
        onOpenChange={(open) => {
          if (!open) setTargetStatus(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this order as{" "}
              {targetStatus?.toLowerCase()}?
              {targetStatus === "completed" && (
                <span className="block mt-1 font-medium">
                  This transfers payment to the seller
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTargetStatus(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => targetStatus && handleAction(targetStatus)}
              disabled={isPending}
            >
              {isPending ? "Confirming..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCancelConfirm}
        onOpenChange={(open) => {
          if (!open) setShowCancelConfirm(false)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleCancel} disabled={cancelPending}>
              {cancelPending ? "Cancelling..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showRefundConfirm}
        onOpenChange={(open) => {
          if (!open) setShowRefundConfirm(false)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Refund</DialogTitle>
            <DialogDescription>
              Are you sure you want to refund this order?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleRefund} disabled={refundPending}>
              {refundPending ? "Refunding..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
