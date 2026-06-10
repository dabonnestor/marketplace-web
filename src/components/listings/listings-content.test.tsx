import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ListingsContent } from "@/components/listings/listings-content"
import type { Listing, PaginatedResponse } from "@/lib/api/types"

vi.mock("@/actions/listings", () => ({
  fetchListings: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

import { fetchListings } from "@/actions/listings"

const listing: Listing = {
  id: "1",
  sellerId: "s1",
  sellerName: "Test Seller",
  title: "Test Item",
  description: "desc",
  price: "10.00",
  category: "Electronics",
  condition: "new",
  shippingCost: "0.00",
  images: [],
  status: "active",
  createdAt: "2025-01-01",
  updatedAt: "2025-01-01",
}

const paginatedResponse: PaginatedResponse<Listing> = {
  data: [listing],
  pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe("ListingsContent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders listing cards when data loads", async () => {
    vi.mocked(fetchListings).mockResolvedValueOnce({
      success: true,
      ...paginatedResponse,
    } as any)

    render(<ListingsContent />, { wrapper })

    expect(await screen.findByText("Test Item")).toBeInTheDocument()
    expect(screen.getByText("$10.00")).toBeInTheDocument()
  })

  it("shows empty state when no listings match", async () => {
    vi.mocked(fetchListings).mockResolvedValueOnce({
      success: true,
      data: [],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
    } as any)

    render(<ListingsContent />, { wrapper })

    expect(
      await screen.findByText("No listings found")
    ).toBeInTheDocument()
  })

  it("shows error state with retry button when fetch fails", async () => {
    vi.mocked(fetchListings).mockResolvedValueOnce({
      success: false,
      error: "Network error",
    } as any)

    render(<ListingsContent />, { wrapper })

    expect(await screen.findByText("Network error")).toBeInTheDocument()
    expect(screen.getByText("Try again")).toBeInTheDocument()
  })
})
