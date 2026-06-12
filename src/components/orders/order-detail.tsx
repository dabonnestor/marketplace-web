"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { QueryKey } from "@tanstack/react-query"
import { useAction } from "@/hooks/use-action"
import {
  fetchOrder,
  updateOrderStatus,
  cancelOrder,
  completeOrder,
  refundOrder,
} from "@/lib/api/actions"
import {
  getValidTransitions,
  canCancel,
  canRefund,
  canCompletePayment,
  statusColor,
  statusLabel,
  shouldPoll,
} from "@/lib/order-state-machine"
import { cn } from "@/lib/utils"
import { badgeClasses, NoImage } from "@/lib/display-utils"
import { StatusProgress } from "./status-progress"
import { OrderSummary } from "./order-summary"
import { ConfirmDialog } from "./confirm-dialog"
import { PaymentFallback } from "./payment-fallback"
import { OrderActions } from "./order-actions"
import type {
  Order,
  Listing,
  OrderStatus,
  OrderStatusTransition,
} from "@/lib/api/types"

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
      return shouldPoll(data.status) ? 30000 : false
    },
  })

  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showRefundConfirm, setShowRefundConfirm] = useState(false)

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

  const canCancelOrder = canCancel(order.status, role)
  const canRefundOrder = canRefund(order.status, role)
  const canCompletePaymentFlag = canCompletePayment(order.status, role, !!order.clientSecret)

  const orderQueryKeys: QueryKey[] = [
    ["purchases"],
    ["sales"],
    ["order", order.id],
  ]

  const { mutate: handleAction, isPending } = useAction(
    async (status: OrderStatus) => {
      if (status === "completed") {
        return completeOrder(order.id)
      }
      return updateOrderStatus(order.id, {
        status,
      } as OrderStatusTransition)
    },
    {
      successMessage: (_result, status) =>
        `Order marked as ${statusLabel(status)}`,
      invalidateKeys: orderQueryKeys,
      onSettled: () => setTargetStatus(null),
    },
  )

  const { mutate: handleCancel, isPending: cancelPending } = useAction(
    () => cancelOrder(order.id),
    {
      successMessage: "Order cancelled",
      invalidateKeys: orderQueryKeys,
      onSettled: () => setShowCancelConfirm(false),
    },
  )

  const { mutate: handleRefund, isPending: refundPending } = useAction(
    () => refundOrder(order.id),
    {
      successMessage: "Refund requested",
      invalidateKeys: orderQueryKeys,
      onSettled: () => setShowRefundConfirm(false),
    },
  )

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

      <OrderSummary order={order} role={role} />

      <OrderActions
        validTransitions={validTransitions}
        canCancel={canCancelOrder}
        canRefund={canRefundOrder}
        onAction={setTargetStatus}
        onCancel={() => setShowCancelConfirm(true)}
        onRefund={() => setShowRefundConfirm(true)}
      />

      {canCompletePaymentFlag && (
        <PaymentFallback
          clientSecret={order.clientSecret!}
          orderId={order.id}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["order", order.id] })}
        />
      )}

      <ConfirmDialog
        open={!!targetStatus}
        onOpenChange={(open) => {
          if (!open) setTargetStatus(null)
        }}
        onConfirm={() => targetStatus && handleAction(targetStatus)}
        isPending={isPending}
        title="Confirm Action"
        description={`Are you sure you want to mark this order as ${targetStatus?.toLowerCase()}?`}
        confirmPendingLabel="Confirming..."
        warning={
          targetStatus === "completed"
            ? "This transfers payment to the seller"
            : undefined
        }
      />

      <ConfirmDialog
        open={showCancelConfirm}
        onOpenChange={(open) => {
          if (!open) setShowCancelConfirm(false)
        }}
        onConfirm={() => handleCancel()}
        isPending={cancelPending}
        title="Confirm Cancellation"
        description="Are you sure you want to cancel this order?"
        confirmPendingLabel="Cancelling..."
      />

      <ConfirmDialog
        open={showRefundConfirm}
        onOpenChange={(open) => {
          if (!open) setShowRefundConfirm(false)
        }}
        onConfirm={() => handleRefund()}
        isPending={refundPending}
        title="Confirm Refund Request"
        description="Are you sure you want to request a refund for this order?"
        confirmPendingLabel="Requesting..."
      />
    </div>
  )
}
