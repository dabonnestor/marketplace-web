import { describe, it, expect, vi, beforeEach } from "vitest"
import { createApiClient, __setClientForTest, getClient } from "./client"
import { MemoryTokenStore } from "./token-store"
import type { TokenStore } from "./token-store"

let store: MemoryTokenStore
let client: ReturnType<typeof createApiClient>

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
  store = new MemoryTokenStore()
  client = createApiClient(store as TokenStore)
  __setClientForTest(client)
})

// These tests verify the public interface of server actions.
// After the serverAction factory refactor, they must still pass
// — the factory preserves the existing contract.

describe("server-action exports", () => {
  describe("fetchListing", () => {
    it("returns { success: true, listing } on success", async () => {
      const { fetchListing } = await import("./actions")
      const listing = { id: "l1", title: "Test", description: "desc", price: 10, category: "Electronics", condition: "new", images: [], sellerId: "s1", createdAt: "2025-01-01", updatedAt: "2025-01-01" }
      vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(listing))

      const result = await fetchListing("l1")

      expect(result).toEqual({ success: true, listing })
    })

    it("returns { success: false, error } on failure", async () => {
      const { fetchListing } = await import("./actions")
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "Not found" } }), { status: 404 })
      )

      const result = await fetchListing("missing")

      expect(result).toEqual({ success: false, error: "Not found" })
    })
  })

  describe("fetchListings", () => {
    it("returns { success: true, data, pagination } on success", async () => {
      const { fetchListings } = await import("./actions")
      const paginated = { data: [{ id: "1", title: "Item" }], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } }
      vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(paginated))

      const result = await fetchListings({ page: 1 })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(paginated.data)
        expect(result.pagination).toEqual(paginated.pagination)
      }
    })
  })

  describe("deleteListing", () => {
    it("returns { success: true } with empty object on 204", async () => {
      const { deleteListing } = await import("./actions")
      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }))

      const result = await deleteListing("l1")

      expect(result).toEqual({ success: true })
    })
  })

  describe("onboardSeller", () => {
    it("returns { success: true, url } on success", async () => {
      const { onboardSeller } = await import("./actions")
      vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ url: "https://stripe.com/onboard" }))

      const result = await onboardSeller()

      expect(result).toEqual({ success: true, url: "https://stripe.com/onboard" })
    })
  })

  describe("createOrder", () => {
    it("returns { success: true, order } on success", async () => {
      const { createOrder } = await import("./actions")
      const order = { id: "o1", listingId: "l1", buyerId: "b1", sellerId: "s1", status: "pending", totalAmount: 50, createdAt: "2025-01-01", updatedAt: "2025-01-01" }
      vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(order))

      const result = await createOrder("l1")

      expect(result).toEqual({ success: true, order })
    })
  })

  describe("getOnboardStatus", () => {
    it("returns { success: true, ...status } on success", async () => {
      const { getOnboardStatus } = await import("./actions")
      const status = { isOnboarded: true, chargesEnabled: true }
      vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(status))

      const result = await getOnboardStatus()

      expect(result).toEqual({ success: true, isOnboarded: true, chargesEnabled: true })
    })
  })
})
