"use server"

import { getClient, withErrorBoundary, getMe } from "./client"
import type { CreateListingInput, UpdateListingInput, OrderStatusTransition } from "./types"

// Auth
export async function login(email: string, password: string) {
  return withErrorBoundary(
    async () => {
      const user = await getClient().login(email, password)
      return { user }
    },
    "Login failed"
  )
}

export async function register(email: string, password: string, name: string) {
  return withErrorBoundary(
    async () => {
      const user = await getClient().register(email, password, name)
      return { user }
    },
    "Registration failed"
  )
}

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
export async function fetchListings(params?: {
  page?: number
  limit?: number
  category?: string
  minPrice?: number
  maxPrice?: number
  search?: string
}) {
  return withErrorBoundary(
    async () => {
      const result = await getClient().getListings(params)
      return { ...result }
    },
    "Failed to fetch listings"
  )
}

export async function fetchListing(id: string) {
  return withErrorBoundary(
    async () => {
      const listing = await getClient().getListing(id)
      return { listing }
    },
    "Failed to fetch listing"
  )
}

export async function createListing(input: CreateListingInput) {
  return withErrorBoundary(
    async () => {
      const listing = await getClient().createListing(input)
      return { listing }
    },
    "Failed to create listing"
  )
}

export async function updateListing(id: string, input: UpdateListingInput) {
  return withErrorBoundary(
    async () => {
      const listing = await getClient().updateListing(id, input)
      return { listing }
    },
    "Failed to update listing"
  )
}

export async function deleteListing(id: string) {
  return withErrorBoundary(
    async () => {
      await getClient().deleteListing(id)
      return {}
    },
    "Failed to delete listing"
  )
}

export async function fetchMyListings(params?: { page?: number; limit?: number }) {
  return withErrorBoundary(
    async () => {
      const result = await getClient().getMyListings(params)
      return { ...result }
    },
    "Failed to fetch your listings"
  )
}

// Orders
export async function createOrder(listingId: string) {
  return withErrorBoundary(
    async () => {
      const order = await getClient().createOrder(listingId)
      return { order }
    },
    "Failed to create order"
  )
}

export async function fetchOrder(id: string) {
  return withErrorBoundary(
    async () => {
      const order = await getClient().getOrder(id)
      return { order }
    },
    "Failed to fetch order"
  )
}

export async function fetchPurchases(params?: {
  page?: number
  limit?: number
  status?: string
}) {
  return withErrorBoundary(
    async () => {
      const result = await getClient().getPurchases(params)
      return { ...result }
    },
    "Failed to fetch purchases"
  )
}

export async function fetchSales(params?: {
  page?: number
  limit?: number
  status?: string
}) {
  return withErrorBoundary(
    async () => {
      const result = await getClient().getSales(params)
      return { ...result }
    },
    "Failed to fetch sales"
  )
}

export async function updateOrderStatus(
  id: string,
  input: OrderStatusTransition
) {
  return withErrorBoundary(
    async () => {
      const order = await getClient().updateOrderStatus(id, input)
      return { order }
    },
    "Failed to update order status"
  )
}

export async function payOrder(orderId: string) {
  return withErrorBoundary(
    async () => {
      const order = await getClient().payOrder(orderId)
      return { order }
    },
    "Failed to process payment"
  )
}

export async function cancelOrder(orderId: string) {
  return withErrorBoundary(
    async () => {
      const order = await getClient().cancelOrder(orderId)
      return { order }
    },
    "Failed to cancel order"
  )
}

export async function refundOrder(orderId: string) {
  return withErrorBoundary(
    async () => {
      const order = await getClient().refundOrder(orderId)
      return { order }
    },
    "Failed to refund order"
  )
}

export async function completeOrder(orderId: string) {
  return withErrorBoundary(
    async () => {
      const order = await getClient().completeOrder(orderId)
      return { order }
    },
    "Failed to complete order"
  )
}

// Seller / Stripe Connect
export async function onboardSeller() {
  return withErrorBoundary(
    async () => {
      const result = await getClient().onboardSeller()
      return { url: result.url }
    },
    "Failed to start seller onboarding"
  )
}

export async function getOnboardStatus() {
  return withErrorBoundary(
    async () => {
      const result = await getClient().getOnboardStatus()
      return { ...result }
    },
    "Failed to check onboarding status"
  )
}
