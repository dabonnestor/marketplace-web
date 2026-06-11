"use client"

import { useEffect, useState, Fragment } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  fetchOrder,
  updateOrderStatus,
  cancelOrder,
  completeOrder,
  refundOrder,
} from "@/lib/api/actions"
import { StripePaymentForm } from "@/components/checkout/stripe-payment-form"
import {
  getValidTransitions,
  statusColor,
  statusLabel,
} from "@/lib/order-utils"
import { cn } from "@/lib/utils"
import { formatCurrency, badgeClasses, NoImage } from "@/lib/display-utils"
import { PriceRow } from "@/components/ui/price-row"
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
  order: initialOrder,
  listing,
  currentUserId,
}: OrderDetailProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: order } = useQuery({
    queryKey: ["order", initialOrder.id],
    queryFn: async () => {
      const result = await fetchOrder(initialOrder.id)
      if (result.success && result.order) return result.order
      throw new Error(result.error || "Failed to fetch order")
    },
    initialData: initialOrder,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return 30000
      const terminalStatuses: OrderStatus[] = ["completed", "cancelled", "expired", "refunded"]
      return terminalStatuses.includes(data.status) ? false : 30000
    },
  })

  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showRefundConfirm, setShowRefundConfirm] = useState(false)
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

  const canCancel = role === "buyer" && order.status === "pending"
  const canRefund =
    role === "buyer" &&
    (order.status === "paid" ||
      order.status === "shipped" ||
      order.status === "delivered")
  const canCompletePayment =
    role === "buyer" && order.status === "pending" && !!order.clientSecret

  const { mutate: handleAction, isPending } = useMutation({
    mutationFn: async (status: OrderStatus) => {
      if (status === "completed") {
        return completeOrder(order.id)
      }
      return updateOrderStatus(order.id, {
        status,
      } as OrderStatusTransition)
    },
    onSuccess: (result, status) => {
      setTargetStatus(null)
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["purchases"] })
        queryClient.invalidateQueries({ queryKey: ["sales"] })
        toast.success(`Order marked as ${statusLabel(status)}`)
        queryClient.invalidateQueries({ queryKey: ["order", order.id] })
      } else {
        toast.error(result.error || "Failed to update order status")
      }
    },
  })

  const { mutate: handleCancel, isPending: cancelPending } = useMutation({
    mutationFn: () => cancelOrder(order.id),
    onSuccess: (result) => {
      setShowCancelConfirm(false)
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["purchases"] })
        queryClient.invalidateQueries({ queryKey: ["sales"] })
        toast.success("Order cancelled")
        queryClient.invalidateQueries({ queryKey: ["order", order.id] })
      } else {
        toast.error(result.error || "Failed to cancel order")
      }
    },
  })

  const { mutate: handleRefund, isPending: refundPending } = useMutation({
    mutationFn: () => refundOrder(order.id),
    onSuccess: (result) => {
      setShowRefundConfirm(false)
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["purchases"] })
        queryClient.invalidateQueries({ queryKey: ["sales"] })
        toast.success("Refund requested")
        queryClient.invalidateQueries({ queryKey: ["order", order.id] })
      } else {
        toast.error(result.error || "Failed to request refund")
      }
    },
  })

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
          <p className="text-sm text-muted-foreground mt-2">
            Order #{order.id}
          </p>
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
          {role === "seller" ? (
            <>
              <PriceRow label="Subtotal" amount={formatCurrency(order.subtotal)} />
              <PriceRow
                label="Platform fee"
                amount={`-${formatCurrency(order.platformFee)}`}
              />
              <Separator />
              <PriceRow label="Total" amount={formatCurrency(order.sellerPayout)} bold />
            </>
          ) : (
            <>
              <PriceRow label="Subtotal" amount={formatCurrency(order.subtotal)} />
              <PriceRow
                label="Shipping"
                amount={formatCurrency(order.shippingCost)}
              />
              <Separator />
              <PriceRow label="Total" amount={formatCurrency(order.total)} bold />
            </>
          )}
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
          <Button onClick={() => setShowPaymentForm(true)} className="w-full">
            Complete Payment
          </Button>
        </div>
      )}

      {canCompletePayment && showPaymentForm && (
        <StripePaymentForm
          clientSecret={order.clientSecret!}
          orderId={order.id}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["order", order.id] })}
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
            Request a Refund
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
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => handleCancel()} disabled={cancelPending}>
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
            <DialogTitle>Confirm Refund Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to request a refund for this order?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRefundConfirm(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => handleRefund()} disabled={refundPending}>
              {refundPending ? "Requesting..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
