import { describe, it, expect, vi, beforeEach } from "vitest"
import { createApiClient, ApiRequestError, __setClientForTest, getClient, withErrorBoundary } from "./client"
import { fetchListing, fetchListings, login, getCurrentUser, logout } from "./actions"
import { MemoryTokenStore } from "./token-store"
import type { TokenStore } from "./token-store"

const API_BASE = "http://localhost:8080"

function mockFetch(responseOverrides: Record<string, Response>) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(
    (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url
      if (responseOverrides[url]) return Promise.resolve(responseOverrides[url])
      return Promise.resolve(
        new Response(JSON.stringify({ error: { code: "UNKNOWN", message: "unmocked" } }), { status: 500 })
      )
    }
  )
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

let store: MemoryTokenStore
let client: ReturnType<typeof createApiClient>

beforeEach(() => {
  vi.restoreAllMocks()
  store = new MemoryTokenStore()
  client = createApiClient(store as TokenStore)
})

// ── Token refresh & retry on 401 ──

describe("apiFetch token refresh", () => {
  it("retries with refreshed token on 401", async () => {
    const freshToken = "fresh-access-token"
    await store.setTokens("expired-token", "valid-refresh-token")

    // 1st call → 401, 2nd call (retry) → 200
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "expired" } }), { status: 401 })
      )
      // refresh endpoint
      .mockResolvedValueOnce(
        jsonResponse({ accessToken: freshToken, refreshToken: "new-refresh" })
      )
      // retried request
      .mockResolvedValueOnce(jsonResponse({ id: "user-1", email: "a@b.com", name: "Test" }))

    const user = await client.getMe()

    expect(user).toMatchObject({ id: "user-1" })
    // Verify retry used the fresh token
    const retryCall = fetchMock.mock.calls[2]
    expect((retryCall[1]?.headers as Record<string, string>)["Authorization"]).toBe(`Bearer ${freshToken}`)
  })

  it("clears tokens and throws on failed refresh", async () => {
    await store.setTokens("expired-token", "invalid-refresh")

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "expired" } }), { status: 401 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: "INVALID_TOKEN", message: "refresh expired" } }), { status: 401 })
      )

    // getMe has a token, tries the request, gets 401, refresh also fails → throws
    await expect(client.getMe()).rejects.toThrow(ApiRequestError)
    expect(await store.getAccessToken()).toBeNull()
    expect(await store.getRefreshToken()).toBeNull()
  })

  it("returns null without calling fetch when no token is stored", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")

    const user = await client.getMe()

    expect(user).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

// ── Error mapping ──

describe("apiFetch error mapping", () => {
  it("throws ApiRequestError with code, status, details on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Title is required",
            details: { title: ["Required"] },
          },
        }),
        { status: 422 }
      )
    )

    try {
      await client.createListing({ title: "", description: "", price: 0, category: "", condition: "" })
      expect.fail("Expected ApiRequestError to be thrown")
    } catch (e) {
      const err = e as ApiRequestError
      expect(err).toBeInstanceOf(ApiRequestError)
      expect(err.code).toBe("VALIDATION_ERROR")
      expect(err.status).toBe(422)
      expect(err.message).toBe("Title is required")
      expect(err.details).toEqual({ title: ["Required"] })
    }
  })

  it("uses fallback message and code when error body has no message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 503 })
    )

    try {
      await client.getListing("1")
      expect.fail("Expected ApiRequestError to be thrown")
    } catch (e) {
      const err = e as ApiRequestError
      expect(err).toBeInstanceOf(ApiRequestError)
      expect(err.message).toBe("Request failed")
      expect(err.code).toBe("UNKNOWN")
      expect(err.status).toBe(503)
    }
  })
})

// ── Token store integration ──

describe("token store integration", () => {
  it("login sets tokens and returns user", async () => {
    const authResponse = {
      user: { id: "u1", email: "a@b.com", name: "Alice", createdAt: "2025-01-01" },
      accessToken: "at-1",
      refreshToken: "rt-1",
    }
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(authResponse))

    const user = await client.login("a@b.com", "password")

    expect(user).toMatchObject({ id: "u1", email: "a@b.com" })
    expect(await store.getAccessToken()).toBe("at-1")
    expect(await store.getRefreshToken()).toBe("rt-1")
  })

  it("register sets tokens and returns user", async () => {
    const authResponse = {
      user: { id: "u2", email: "b@c.com", name: "Bob", createdAt: "2025-01-02" },
      accessToken: "at-2",
      refreshToken: "rt-2",
    }
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(authResponse))

    const user = await client.register("b@c.com", "password", "Bob")

    expect(user).toMatchObject({ id: "u2" })
    expect(await store.getAccessToken()).toBe("at-2")
    expect(await store.getRefreshToken()).toBe("rt-2")
  })

  it("logout clears tokens", async () => {
    await store.setTokens("at", "rt")
    await client.logout()

    expect(await store.getAccessToken()).toBeNull()
    expect(await store.getRefreshToken()).toBeNull()
  })

  it("getMe returns null when no token is stored", async () => {
    const user = await client.getMe()
    expect(user).toBeNull()
  })

  it("includes Authorization header when token exists", async () => {
    await store.setTokens("my-token", "my-refresh")
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ id: "listing-1", title: "Test" })
    )

    await client.getListing("listing-1")

    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>
    expect(headers["Authorization"]).toBe("Bearer my-token")
  })

  it("does not include Authorization header when no token", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ data: [], pagination: {} }))

    await client.getListings()

    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>
    expect(headers["Authorization"]).toBeUndefined()
  })
})

// ── 204 no-content ──

describe("204 no-content", () => {
  it("returns undefined for 204 responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }))

    const result = await client.deleteListing("1")
    expect(result).toBeUndefined()
  })
})

// ── Request serialization ──

describe("request serialization", () => {
  it("serializes query params for paginated endpoints", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } })
    )

    await client.getListings({ page: 2, limit: 5, category: "Electronics", search: "phone" })

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain("page=2")
    expect(url).toContain("limit=5")
    expect(url).toContain("category=Electronics")
    expect(url).toContain("search=phone")
  })

  it("omits undefined and empty params", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } })
    )

    await client.getListings({ page: 1, category: "" })

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain("page=1")
    expect(url).not.toContain("category")
  })

  it("sends JSON body for POST requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ id: "order-1", status: "pending" })
    )

    await client.createOrder("listing-1")

    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
    expect(body).toEqual({ listingId: "listing-1" })
  })

  it("sends JSON body for PATCH requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ id: "listing-1", title: "Updated" })
    )

    await client.updateListing("listing-1", { title: "Updated" })

    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
    const method = fetchMock.mock.calls[0][1]?.method
    expect(method).toBe("PATCH")
    expect(body).toMatchObject({ title: "Updated" })
  })
})

// ── Individual endpoint contracts ──

describe("endpoint contracts", () => {
  it("getListings hits /api/v1/listings", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } })
    )
    await client.getListings()
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/api/v1/listings`)
  })

  it("getListing hits /api/v1/listings/:id", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ id: "x" }))
    await client.getListing("x")
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/api/v1/listings/x`)
  })

  it("getOrder hits /api/v1/orders/:id", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ id: "o1" }))
    await client.getOrder("o1")
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/api/v1/orders/o1`)
  })

  it("getPurchases hits /api/v1/orders/buyer/purchases", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } })
    )
    await client.getPurchases({ status: "paid" })
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/api/v1/orders/buyer/purchases?status=paid`)
  })

  it("getSales hits /api/v1/orders/seller/sales", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } })
    )
    await client.getSales({ status: "shipped" })
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/api/v1/orders/seller/sales?status=shipped`)
  })

  it("getMyListings hits /api/v1/listings/mine", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } })
    )
    await client.getMyListings({ page: 2 })
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/api/v1/listings/mine?page=2`)
  })

  it("updateOrderStatus hits /api/v1/orders/:id/status with PATCH", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ id: "o1" }))
    await client.updateOrderStatus("o1", { status: "shipped" })
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/api/v1/orders/o1/status`)
    expect(fetchMock.mock.calls[0][1]?.method).toBe("PATCH")
  })

  it("cancelOrder hits /api/v1/orders/:id/cancel with POST", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ id: "o1" }))
    await client.cancelOrder("o1")
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/api/v1/orders/o1/cancel`)
    expect(fetchMock.mock.calls[0][1]?.method).toBe("POST")
  })

  it("refundOrder hits /api/v1/orders/:id/refund with POST", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ id: "o1" }))
    await client.refundOrder("o1")
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/api/v1/orders/o1/refund`)
    expect(fetchMock.mock.calls[0][1]?.method).toBe("POST")
  })
})

// ── Server-action wrapper exports ──

describe("server-action wrapped exports", () => {
  let store: MemoryTokenStore
  let client: ReturnType<typeof createApiClient>

  beforeEach(() => {
    vi.restoreAllMocks()
    store = new MemoryTokenStore()
    client = createApiClient(store as TokenStore)
    __setClientForTest(client)
  })

  describe("fetchListing", () => {
    it("returns { success: true, listing } on success", async () => {
      const listing = { id: "123", title: "Test Listing", description: "Desc", price: 50, category: "Electronics", condition: "new", images: [], sellerId: "s1", createdAt: "2025-01-01", updatedAt: "2025-01-01" }
      vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(listing))

      const result = await fetchListing("123")

      expect(result).toEqual({ success: true, listing })
    })

    it("returns { success: false, error } on failure", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "Listing not found" } }), { status: 404 })
      )

      const result = await fetchListing("nonexistent")

      expect(result).toEqual({ success: false, error: "Listing not found" })
    })

    it("uses fallback error message when error body has no message", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({}), { status: 500 })
      )

      const result = await fetchListing("123")

      expect(result.success).toBe(false)
      // ApiRequestError.message is "Request failed" (apiFetch's fallback)
      expect(result.error).toBe("Request failed")
    })
  })

  describe("fetchListings", () => {
    it("returns { success: true, ...paginatedResult } on success", async () => {
      const paginated = { data: [{ id: "1", title: "Item" }], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } }
      vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(paginated))

      const result = await fetchListings({ page: 1 })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(paginated.data)
      expect(result.pagination).toEqual(paginated.pagination)
    })
  })

  describe("login", () => {
    it("returns { success: true, user } on successful login", async () => {
      const user = { id: "u1", email: "a@b.com", name: "Alice", createdAt: "2025-01-01" }
      vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({
        user,
        accessToken: "at",
        refreshToken: "rt",
      }))

      const result = await login("a@b.com", "password")

      expect(result).toEqual({ success: true, user })
      expect(await store.getAccessToken()).toBe("at")
    })

    it("returns { success: false, error } on failed login", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Invalid credentials" } }), { status: 401 })
      )

      const result = await login("a@b.com", "wrong")

      expect(result).toEqual({ success: false, error: "Invalid credentials" })
    })
  })

  describe("getCurrentUser", () => {
    it("returns user object when authenticated", async () => {
      const user = { id: "u1", email: "a@b.com", name: "Alice", createdAt: "2025-01-01" }
      await store.setTokens("at", "rt")
      vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(user))

      const result = await getCurrentUser()

      expect(result).toEqual(user)
    })

    it("returns null when no token is stored", async () => {
      const result = await getCurrentUser()

      expect(result).toBeNull()
    })

    it("returns null when API call fails", async () => {
      await store.setTokens("at", "rt")
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"))

      const result = await getCurrentUser()

      expect(result).toBeNull()
    })
  })

  describe("logout", () => {
    it("clears tokens", async () => {
      await store.setTokens("at", "rt")

      await logout()

      expect(await store.getAccessToken()).toBeNull()
      expect(await store.getRefreshToken()).toBeNull()
    })
  })
})

// ── RSC data-fetching deduplication ──

describe("RSC data fetching (cached for request dedup)", () => {
  let store: MemoryTokenStore
  let client: ReturnType<typeof createApiClient>

  beforeEach(() => {
    vi.restoreAllMocks()
    store = new MemoryTokenStore()
    client = createApiClient(store as TokenStore)
    __setClientForTest(client)
  })

  function jsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  }

  it("getListing returns listing data through the cached wrapper", async () => {
    const listing = { id: "l1", title: "Cached Listing", description: "desc", price: 99, images: [], category: "other", status: "active", sellerId: "s1", createdAt: "2026-01-01", updatedAt: "2026-01-01" }
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(listing))

    const { getListing } = await import("./client")
    const result = await getListing("l1")

    expect(result).toMatchObject({ id: "l1", title: "Cached Listing" })
  })

  it("getListing propagates errors through the cached wrapper", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "Listing not found" } }), { status: 404 })
    )

    const { getListing, ApiRequestError } = await import("./client")

    await expect(getListing("nonexistent")).rejects.toThrow(ApiRequestError)
  })

  it("getOrder returns order data through the cached wrapper", async () => {
    const order = { id: "o1", listingId: "l1", buyerId: "b1", sellerId: "s1", status: "pending", totalAmount: 99, createdAt: "2026-01-01", updatedAt: "2026-01-01" }
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(order))

    const { getOrder } = await import("./client")
    const result = await getOrder("o1")

    expect(result).toMatchObject({ id: "o1", status: "pending" })
  })
})
