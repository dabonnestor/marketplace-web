import { cookies } from "next/headers"
import type {
  AuthResponse,
  RefreshResponse,
  User,
  Listing,
  PaginatedResponse,
  Order,
  CreateListingInput,
  UpdateListingInput,
  OrderStatusTransition,
  ApiError,
} from "./types"

const API_BASE = process.env.API_BASE_URL || "http://localhost:3000"

async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("accessToken")?.value ?? null
}

async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("refreshToken")?.value ?? null
}

async function setTokens(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()
  cookieStore.set("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 minutes
  })
  cookieStore.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })
}

async function clearTokens() {
  const cookieStore = await cookies()
  cookieStore.delete("accessToken")
  cookieStore.delete("refreshToken")
}

async function refreshTokens(): Promise<string | null> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) return null

  const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  })

  if (!res.ok) {
    await clearTokens()
    return null
  }

  const data: RefreshResponse = await res.json()
  await setTokens(data.accessToken, data.refreshToken)
  return data.accessToken
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token = await getAccessToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  // If 401, try refreshing the token
  if (res.status === 401 && token) {
    token = await refreshTokens()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
      res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      })
    }
  }

  if (!res.ok) {
    const error: ApiError = await res.json()
    throw new ApiRequestError(
      error.error?.message || "Request failed",
      error.error?.code || "UNKNOWN",
      res.status,
      error.error?.details
    )
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: Record<string, string[]>
  ) {
    super(message)
    this.name = "ApiRequestError"
  }
}

// Auth
export async function login(email: string, password: string) {
  const data = await apiFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
  await setTokens(data.accessToken, data.refreshToken)
  return data.user
}

export async function register(email: string, password: string, name: string) {
  const data = await apiFetch<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  })
  await setTokens(data.accessToken, data.refreshToken)
  return data.user
}

export async function getMe(): Promise<User | null> {
  const token = await getAccessToken()
  if (!token) return null
  return apiFetch<User>("/api/v1/auth/me")
}

export async function logout() {
  await clearTokens()
}

// Listings
export async function getListings(params?: {
  page?: number
  limit?: number
  category?: string
  minPrice?: number
  maxPrice?: number
  search?: string
}) {
  const searchParams = new URLSearchParams()
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        searchParams.set(key, String(value))
      }
    }
  }
  const query = searchParams.toString()
  return apiFetch<PaginatedResponse<Listing>>(
    `/api/v1/listings${query ? `?${query}` : ""}`
  )
}

export async function getListing(id: string) {
  return apiFetch<Listing>(`/api/v1/listings/${id}`)
}

export async function createListing(input: CreateListingInput) {
  return apiFetch<Listing>("/api/v1/listings", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function updateListing(id: string, input: UpdateListingInput) {
  return apiFetch<Listing>(`/api/v1/listings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export async function deleteListing(id: string) {
  return apiFetch<void>(`/api/v1/listings/${id}`, { method: "DELETE" })
}

export async function getMyListings(params?: {
  page?: number
  limit?: number
}) {
  const searchParams = new URLSearchParams()
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value))
      }
    }
  }
  const query = searchParams.toString()
  return apiFetch<PaginatedResponse<Listing>>(
    `/api/v1/listings/mine${query ? `?${query}` : ""}`
  )
}

// Orders
export async function createOrder(listingId: string) {
  return apiFetch<Order>("/api/v1/orders", {
    method: "POST",
    body: JSON.stringify({ listingId }),
  })
}

export async function getOrder(id: string) {
  return apiFetch<Order>(`/api/v1/orders/${id}`)
}

export async function getPurchases(params?: {
  page?: number
  limit?: number
  status?: string
}) {
  const searchParams = new URLSearchParams()
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value))
      }
    }
  }
  const query = searchParams.toString()
  return apiFetch<PaginatedResponse<Order>>(
    `/api/v1/orders/buyer/purchases${query ? `?${query}` : ""}`
  )
}

export async function getSales(params?: {
  page?: number
  limit?: number
  status?: string
}) {
  const searchParams = new URLSearchParams()
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value))
      }
    }
  }
  const query = searchParams.toString()
  return apiFetch<PaginatedResponse<Order>>(
    `/api/v1/orders/seller/sales${query ? `?${query}` : ""}`
  )
}

export async function updateOrderStatus(
  id: string,
  input: OrderStatusTransition
) {
  return apiFetch<Order>(`/api/v1/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}
