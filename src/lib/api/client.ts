import type {
  AuthResponse,
  RefreshResponse,
  User,
  Listing,
  PaginatedResponse,
  Order,
  PurchaseOrder,
  SaleOrder,
  CreateListingInput,
  UpdateListingInput,
  OrderStatusTransition,
  OnboardSellerResponse,
  OnboardStatusResponse,
  ApiError,
} from "./types"
import { type TokenStore, CookieTokenStore } from "./token-store"

const API_BASE = process.env.API_BASE_URL || "http://localhost:8080"

let _client: ReturnType<typeof createApiClient> | null = null

async function refreshTokens(
  tokenStore: TokenStore
): Promise<string | null> {
  const refreshToken = await tokenStore.getRefreshToken()
  if (!refreshToken) return null

  const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  })

  if (!res.ok) {
    await tokenStore.clearTokens()
    return null
  }

  const data: RefreshResponse = await res.json()
  await tokenStore.setTokens(data.accessToken, data.refreshToken)
  return data.accessToken
}

async function apiFetch<T>(
  path: string,
  tokenStore: TokenStore,
  options: RequestInit = {}
): Promise<T> {
  let token = await tokenStore.getAccessToken()

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

  if (res.status === 401 && token) {
    token = await refreshTokens(tokenStore)
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

export function createApiClient(tokenStore: TokenStore) {
  return {
    // Auth
    async login(email: string, password: string) {
      const data = await apiFetch<AuthResponse>(
        "/api/v1/auth/login",
        tokenStore,
        { method: "POST", body: JSON.stringify({ email, password }) }
      )
      await tokenStore.setTokens(data.accessToken, data.refreshToken)
      return data.user
    },

    async register(email: string, password: string, name: string) {
      const data = await apiFetch<AuthResponse>(
        "/api/v1/auth/register",
        tokenStore,
        { method: "POST", body: JSON.stringify({ email, password, name }) }
      )
      await tokenStore.setTokens(data.accessToken, data.refreshToken)
      return data.user
    },

    async getMe(): Promise<User | null> {
      const token = await tokenStore.getAccessToken()
      if (!token) return null
      return apiFetch<User>("/api/v1/auth/me", tokenStore)
    },

    async logout() {
      await tokenStore.clearTokens()
    },

    // Listings
    async getListings(params?: {
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
        `/api/v1/listings${query ? `?${query}` : ""}`,
        tokenStore
      )
    },

    async getListing(id: string) {
      return apiFetch<Listing>(`/api/v1/listings/${id}`, tokenStore)
    },

    async createListing(input: CreateListingInput) {
      return apiFetch<Listing>("/api/v1/listings", tokenStore, {
        method: "POST",
        body: JSON.stringify(input),
      })
    },

    async updateListing(id: string, input: UpdateListingInput) {
      return apiFetch<Listing>(`/api/v1/listings/${id}`, tokenStore, {
        method: "PATCH",
        body: JSON.stringify(input),
      })
    },

    async deleteListing(id: string) {
      return apiFetch<void>(`/api/v1/listings/${id}`, tokenStore, {
        method: "DELETE",
      })
    },

    async getMyListings(params?: { page?: number; limit?: number }) {
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
        `/api/v1/listings/mine${query ? `?${query}` : ""}`,
        tokenStore
      )
    },

    // Orders
    async createOrder(listingId: string) {
      return apiFetch<Order>("/api/v1/orders", tokenStore, {
        method: "POST",
        body: JSON.stringify({ listingId }),
      })
    },

    async getOrder(id: string) {
      return apiFetch<Order>(`/api/v1/orders/${id}`, tokenStore)
    },

    async getPurchases(params?: {
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
      return apiFetch<PaginatedResponse<PurchaseOrder>>(
        `/api/v1/orders/buyer/purchases${query ? `?${query}` : ""}`,
        tokenStore
      )
    },

    async getSales(params?: {
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
      return apiFetch<PaginatedResponse<SaleOrder>>(
        `/api/v1/orders/seller/sales${query ? `?${query}` : ""}`,
        tokenStore
      )
    },

    async updateOrderStatus(id: string, input: OrderStatusTransition) {
      return apiFetch<Order>(`/api/v1/orders/${id}/status`, tokenStore, {
        method: "PATCH",
        body: JSON.stringify(input),
      })
    },

    async payOrder(orderId: string) {
      return apiFetch<Order>(`/api/v1/orders/${orderId}/pay`, tokenStore, {
        method: "POST",
      })
    },

    async cancelOrder(orderId: string) {
      return apiFetch<Order>(`/api/v1/orders/${orderId}/cancel`, tokenStore, {
        method: "POST",
      })
    },

    async refundOrder(orderId: string) {
      return apiFetch<Order>(`/api/v1/orders/${orderId}/refund`, tokenStore, {
        method: "POST",
      })
    },

    async completeOrder(orderId: string) {
      return apiFetch<Order>(`/api/v1/orders/${orderId}/complete`, tokenStore, {
        method: "POST",
      })
    },

    // Seller / Stripe Connect
    async onboardSeller() {
      return apiFetch<OnboardSellerResponse>(
        "/api/v1/seller/onboard",
        tokenStore,
        { method: "POST" }
      )
    },

    async getOnboardStatus() {
      return apiFetch<OnboardStatusResponse>(
        "/api/v1/seller/onboard/status",
        tokenStore
      )
    },
  }
}

// ── Test-only client override ──

let _clientOverride: ReturnType<typeof createApiClient> | null = null

export function __setClientForTest(c: ReturnType<typeof createApiClient> | null) {
  _clientOverride = c
}

export function getClient(): ReturnType<typeof createApiClient> {
  if (_clientOverride) return _clientOverride
  if (!_client) _client = createApiClient(new CookieTokenStore())
  return _client
}

// ── Error-boundary helper ──

type ActionOk<T extends Record<string, unknown>> = T & { success: true; error?: undefined }
type ActionErr = { success: false; error: string }

export async function withErrorBoundary<T extends Record<string, unknown>>(
  fn: () => Promise<T>,
  fallbackError: string
): Promise<ActionOk<T> | ActionErr> {
  try {
    const data = await fn()
    return { success: true as const, ...data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : fallbackError,
    }
  }
}

// ── Raw data-fetching (for RSC pages — throw on error) ──

export async function getMe() {
  return getClient().getMe()
}

export async function getListings(params?: {
  page?: number
  limit?: number
  category?: string
  minPrice?: number
  maxPrice?: number
  search?: string
}) {
  return getClient().getListings(params)
}

export async function getListing(id: string) {
  return getClient().getListing(id)
}

export async function getMyListings(params?: { page?: number; limit?: number }) {
  return getClient().getMyListings(params)
}

export async function getOrder(id: string) {
  return getClient().getOrder(id)
}

export async function getPurchases(params?: {
  page?: number
  limit?: number
  status?: string
}) {
  return getClient().getPurchases(params)
}

export async function getSales(params?: {
  page?: number
  limit?: number
  status?: string
}) {
  return getClient().getSales(params)
}

