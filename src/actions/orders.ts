"use server"

import {
  createOrder as apiCreateOrder,
  getOrder,
  getPurchases,
  getSales,
  updateOrderStatus as apiUpdateOrderStatus,
  payOrder as apiPayOrder,
} from "@/lib/api/client"
import type { OrderStatusTransition } from "@/lib/api/types"
import { wrapAction } from "@/lib/wrap-action"

export async function createOrder(listingId: string) {
  return wrapAction(
    async () => {
      const order = await apiCreateOrder(listingId)
      return { success: true as const, order }
    },
    "Failed to create order"
  )
}

export async function fetchOrder(id: string) {
  return wrapAction(
    async () => {
      const order = await getOrder(id)
      return { success: true as const, order }
    },
    "Failed to fetch order"
  )
}

export async function fetchPurchases(params?: {
  page?: number
  limit?: number
  status?: string
}) {
  return wrapAction(
    async () => {
      const result = await getPurchases(params)
      return { success: true as const, ...result }
    },
    "Failed to fetch purchases"
  )
}

export async function fetchSales(params?: {
  page?: number
  limit?: number
  status?: string
}) {
  return wrapAction(
    async () => {
      const result = await getSales(params)
      return { success: true as const, ...result }
    },
    "Failed to fetch sales"
  )
}

export async function updateOrderStatus(id: string, input: OrderStatusTransition) {
  return wrapAction(
    async () => {
      const order = await apiUpdateOrderStatus(id, input)
      return { success: true as const, order }
    },
    "Failed to update order status"
  )
}

export async function payOrder(orderId: string) {
  return wrapAction(
    async () => {
      const order = await apiPayOrder(orderId)
      return { success: true as const, order }
    },
    "Failed to process payment"
  )
}
