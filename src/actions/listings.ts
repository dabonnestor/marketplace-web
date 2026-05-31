"use server"

import {
  getListings,
  getListing,
  createListing as apiCreateListing,
  updateListing as apiUpdateListing,
  deleteListing as apiDeleteListing,
  getMyListings,
} from "@/lib/api/client"
import type { CreateListingInput } from "@/lib/api/types"
import { wrapAction } from "@/lib/wrap-action"

export async function fetchListings(params?: {
  page?: number
  limit?: number
  category?: string
  minPrice?: number
  maxPrice?: number
  search?: string
}) {
  return wrapAction(
    async () => {
      const result = await getListings(params)
      return { success: true as const, ...result }
    },
    "Failed to fetch listings"
  )
}

export async function fetchListing(id: string) {
  return wrapAction(
    async () => {
      const listing = await getListing(id)
      return { success: true as const, listing }
    },
    "Failed to fetch listing"
  )
}

export async function createListing(input: CreateListingInput) {
  return wrapAction(
    async () => {
      const listing = await apiCreateListing(input)
      return { success: true as const, listing }
    },
    "Failed to create listing"
  )
}

export async function updateListing(id: string, input: Partial<CreateListingInput>) {
  return wrapAction(
    async () => {
      const listing = await apiUpdateListing(id, input)
      return { success: true as const, listing }
    },
    "Failed to update listing"
  )
}

export async function deleteListing(id: string) {
  return wrapAction(
    async () => {
      await apiDeleteListing(id)
      return { success: true as const }
    },
    "Failed to delete listing"
  )
}

export async function fetchMyListings(params?: { page?: number; limit?: number }) {
  return wrapAction(
    async () => {
      const result = await getMyListings(params)
      return { success: true as const, ...result }
    },
    "Failed to fetch your listings"
  )
}
