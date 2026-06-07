import type { OrderStatus } from "./api/types"

type Role = "buyer" | "seller" | "none"

const TRANSITIONS: Record<OrderStatus, Record<Role, OrderStatus[]>> = {
  pending:   { buyer: ["paid"], seller: [], none: [] },
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
  role: Role
): OrderStatus[] {
  return TRANSITIONS[status]?.[role] ?? []
}

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

export function statusLabel(status: OrderStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
