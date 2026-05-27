"use server"

import {
  getListings,
  getListing,
  createListing as apiCreateListing,
  updateListing as apiUpdateListing,
  deleteListing as apiDeleteListing,
  getMyListings,
} from "@/lib/api/client"
import type { CreateListingInput, Listing, Pagination } from "@/lib/api/types"

type FetchListingsResult =
  | { success: true; data: Listing[]; pagination: Pagination }
  | { success: false; error: string }

export async function fetchListings(
  params?: {
    page?: number
    limit?: number
    category?: string
    minPrice?: number
    maxPrice?: number
    search?: string
  }
): Promise<FetchListingsResult> {
  try {
    const result = await getListings(params)
    return { success: true, ...result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch listings",
    }
  }
}

export async function fetchListing(id: string) {
  try {
    return { success: true, listing: await getListing(id) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch listing",
    }
  }
}

export async function createListing(input: CreateListingInput) {
  try {
    const listing = await apiCreateListing(input)
    return { success: true, listing }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create listing",
    }
  }
}

export async function updateListing(
  id: string,
  input: Partial<CreateListingInput>
) {
  try {
    const listing = await apiUpdateListing(id, input)
    return { success: true, listing }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update listing",
    }
  }
}

export async function deleteListing(id: string) {
  try {
    await apiDeleteListing(id)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete listing",
    }
  }
}

export async function fetchMyListings(params?: {
  page?: number
  limit?: number
}) {
  try {
    return { success: true, ...(await getMyListings(params)) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch your listings",
    }
  }
}
