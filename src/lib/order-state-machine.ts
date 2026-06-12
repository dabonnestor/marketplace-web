import type { OrderStatus } from "./api/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Role = "buyer" | "seller" | "none"

// ---------------------------------------------------------------------------
// All statuses
// ---------------------------------------------------------------------------
export const allStatuses: readonly OrderStatus[] = Object.freeze([
  "pending",
  "paid",
  "shipped",
  "delivered",
  "completed",
  "disputed",
  "cancelled",
  "expired",
  "refunded",
]) as readonly OrderStatus[]

// ---------------------------------------------------------------------------
// Terminal statuses — orders that will not change further
// ---------------------------------------------------------------------------
const TERMINAL_STATUSES: ReadonlySet<OrderStatus> = new Set([
  "completed",
  "cancelled",
  "expired",
  "refunded",
])

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.has(status)
}

export function shouldPoll(status: OrderStatus): boolean {
  return !isTerminal(status)
}

// ---------------------------------------------------------------------------
// Progress steps — the happy-path linear flow
// ---------------------------------------------------------------------------
export const progressSteps: readonly OrderStatus[] = Object.freeze([
  "pending",
  "paid",
  "shipped",
  "delivered",
  "completed",
]) as readonly OrderStatus[]

// ---------------------------------------------------------------------------
// Transitions — which statuses a given role can move to from each status
// ---------------------------------------------------------------------------
const TRANSITIONS: Record<OrderStatus, Record<Role, OrderStatus[]>> = {
  pending:   { buyer: [], seller: [], none: [] },
  paid:      { buyer: [], seller: ["shipped"], none: [] },
  shipped:   { buyer: [], seller: ["delivered"], none: [] },
  delivered: { buyer: ["completed"], seller: [], none: [] },
  completed: { buyer: [], seller: [], none: [] },
  disputed:  { buyer: [], seller: [], none: [] },
  cancelled: { buyer: [], seller: [], none: [] },
  expired:   { buyer: [], seller: [], none: [] },
  refunded:  { buyer: [], seller: [], none: [] },
}

export function getValidTransitions(
  status: OrderStatus,
  role: Role,
): OrderStatus[] {
  return TRANSITIONS[status]?.[role] ?? []
}

// ---------------------------------------------------------------------------
// Eligibility checks — composable from the state machine knowledge
// ---------------------------------------------------------------------------

/** Buyer can cancel only while the order is still pending. */
export function canCancel(status: OrderStatus, role: Role): boolean {
  return role === "buyer" && status === "pending"
}

/** Buyer can request a refund after payment but before completion. */
export function canRefund(status: OrderStatus, role: Role): boolean {
  return (
    role === "buyer" &&
    (status === "paid" || status === "shipped" || status === "delivered")
  )
}

/** Buyer can complete payment on a pending order that has a Stripe clientSecret. */
export function canCompletePayment(
  status: OrderStatus,
  role: Role,
  hasClientSecret: boolean,
): boolean {
  return role === "buyer" && status === "pending" && hasClientSecret
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------
const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "gray",
  paid: "blue",
  shipped: "orange",
  delivered: "green",
  completed: "green",
  disputed: "red",
  cancelled: "red",
  expired: "red",
  refunded: "red",
}

export function statusColor(status: OrderStatus): string {
  return STATUS_COLORS[status]
}

/** CSS badge classes keyed by the same color names returned by statusColor(). */
export const badgeClasses: Record<string, string> = {
  gray: "bg-gray-100 text-gray-800 border-gray-300",
  blue: "bg-blue-100 text-blue-800 border-blue-300",
  orange: "bg-orange-100 text-orange-800 border-orange-300",
  green: "bg-green-100 text-green-800 border-green-300",
  red: "bg-red-100 text-red-800 border-red-300",
}

export function statusLabel(status: OrderStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

/** Human-readable action label for a transition target status. */
export function actionLabel(status: OrderStatus): string {
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
