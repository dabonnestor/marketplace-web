"use server"

import { getClient, withErrorBoundary, getMe } from "./client"
import type { CreateListingInput, UpdateListingInput, OrderStatusTransition } from "./types"

// ── Factory ──
// Wraps any async function with withErrorBoundary so every server action
// returns { success: true, ...data } | { success: false, error }.
// The fn should return the already-shaped data object (e.g. { listing }, { order }, etc.)
// because withErrorBoundary spreads it: { success: true, ...data }.

type ActionOk<T extends Record<string, unknown>> = T & { success: true }
type ActionErr = { success: false; error: string }

function serverAction<Args extends unknown[], T extends Record<string, unknown>>(
  fn: (...args: Args) => Promise<T>,
  fallbackError: string
): (...args: Args) => Promise<ActionOk<T> | ActionErr> {
  return (...args: Args) =>
    withErrorBoundary(async () => fn(...args), fallbackError)
}

// Auth

export const login = serverAction(
  async (email: string, password: string) => {
    const user = await getClient().login(email, password)
    return { user }
  },
  "Login failed"
)

export const register = serverAction(
  async (email: string, password: string, name: string) => {
    const user = await getClient().register(email, password, name)
    return { user }
  },
  "Registration failed"
)

export async function getCurrentUser() {
  try {
    return await getMe()
  } catch {
    return null
  }
}

export async function logout() {
  return getClient().logout()
}

// Listings

export const fetchListings = serverAction(
  (params?: { page?: number; limit?: number; category?: string; minPrice?: number; maxPrice?: number; search?: string }) =>
    getClient().getListings(params),
  "Failed to fetch listings"
)

export const fetchListing = serverAction(
  (id: string) => getClient().getListing(id).then(listing => ({ listing })),
  "Failed to fetch listing"
)

export const createListing = serverAction(
  (input: CreateListingInput) => getClient().createListing(input).then(listing => ({ listing })),
  "Failed to create listing"
)

export const updateListing = serverAction(
  (id: string, input: UpdateListingInput) => getClient().updateListing(id, input).then(listing => ({ listing })),
  "Failed to update listing"
)

export const deleteListing = serverAction(
  async (id: string) => {
    await getClient().deleteListing(id)
    return {}
  },
  "Failed to delete listing"
)

export const fetchMyListings = serverAction(
  (params?: { page?: number; limit?: number }) => getClient().getMyListings(params),
  "Failed to fetch your listings"
)

// Orders

export const createOrder = serverAction(
  (listingId: string) => getClient().createOrder(listingId).then(order => ({ order })),
  "Failed to create order"
)

export const fetchOrder = serverAction(
  (id: string) => getClient().getOrder(id).then(order => ({ order })),
  "Failed to fetch order"
)

export const fetchPurchases = serverAction(
  (params?: { page?: number; limit?: number; status?: string }) => getClient().getPurchases(params),
  "Failed to fetch purchases"
)

export const fetchSales = serverAction(
  (params?: { page?: number; limit?: number; status?: string }) => getClient().getSales(params),
  "Failed to fetch sales"
)

export const updateOrderStatus = serverAction(
  (id: string, input: OrderStatusTransition) => getClient().updateOrderStatus(id, input).then(order => ({ order })),
  "Failed to update order status"
)

export const payOrder = serverAction(
  (orderId: string) => getClient().payOrder(orderId).then(order => ({ order })),
  "Failed to process payment"
)

export const cancelOrder = serverAction(
  (orderId: string) => getClient().cancelOrder(orderId).then(order => ({ order })),
  "Failed to cancel order"
)

export const refundOrder = serverAction(
  (orderId: string) => getClient().refundOrder(orderId).then(order => ({ order })),
  "Failed to refund order"
)

export const completeOrder = serverAction(
  (orderId: string) => getClient().completeOrder(orderId).then(order => ({ order })),
  "Failed to complete order"
)

// Seller / Stripe Connect

export const onboardSeller = serverAction(
  async () => {
    const result = await getClient().onboardSeller()
    return { url: result.url }
  },
  "Failed to start seller onboarding"
)

export const getOnboardStatus = serverAction(
  () => getClient().getOnboardStatus(),
  "Failed to check onboarding status"
)
