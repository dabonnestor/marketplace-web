"use server"

import {
  createOrder as apiCreateOrder,
  getOrder,
  getPurchases,
  getSales,
  updateOrderStatus as apiUpdateOrderStatus,
} from "@/lib/api/client"
import type { OrderStatusTransition } from "@/lib/api/types"

export async function createOrder(listingId: string) {
  try {
    const order = await apiCreateOrder(listingId)
    return { success: true, order }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create order",
    }
  }
}

export async function fetchOrder(id: string) {
  try {
    return { success: true, order: await getOrder(id) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch order",
    }
  }
}

export async function fetchPurchases(params?: {
  page?: number
  limit?: number
  status?: string
}) {
  try {
    return { success: true, ...(await getPurchases(params)) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch purchases",
    }
  }
}

export async function fetchSales(params?: {
  page?: number
  limit?: number
  status?: string
}) {
  try {
    return { success: true, ...(await getSales(params)) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch sales",
    }
  }
}

export async function updateOrderStatus(
  id: string,
  input: OrderStatusTransition
) {
  try {
    const order = await apiUpdateOrderStatus(id, input)
    return { success: true, order }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update order status",
    }
  }
}
