import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { Listing, Pagination } from "@/lib/api/types"

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}))

vi.mock("@/actions/listings", () => ({
  fetchMyListings: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}))

import { fetchMyListings } from "@/actions/listings"
import { MyListings } from "@/components/listings/my-listings"

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "listing-1",
    sellerId: "seller-1",
    sellerName: "Test Seller",
    title: "Vintage Watch",
    description: "A beautiful vintage watch",
    price: "99.99",
    category: "Electronics",
    condition: "Like New",
    shippingCost: "5.00",
    images: ["https://example.com/watch.jpg"],
    status: "active",
    createdAt: "2025-06-01T00:00:00Z",
    updatedAt: "2025-06-01T00:00:00Z",
    ...overrides,
  }
}

const pagination: Pagination = { page: 1, limit: 10, total: 1, totalPages: 1 }

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe("MyListings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders listing cards with title, price, and status badge (Active=green, Sold=gray)", async () => {
    vi.mocked(fetchMyListings).mockResolvedValueOnce({
      success: true,
      data: [
        makeListing({ id: "1", title: "Active Item", status: "active" }),
        makeListing({ id: "2", title: "Sold Item", status: "sold" }),
      ],
      pagination,
    } as any)

    render(<MyListings />, { wrapper })

    expect(await screen.findByText("Active Item")).toBeInTheDocument()
    expect(screen.getByText("Sold Item")).toBeInTheDocument()
    expect(screen.getAllByText("$99.99")).toHaveLength(2)

    const activeBadge = screen.getByText("Active")
    expect(activeBadge.className).toMatch(/green/)

    const soldBadge = screen.getByText("Sold")
    expect(soldBadge.className).toMatch(/gray/)
  })

  it("each card links to /listings/[id] and has an Edit button linking to /listings/[id]/edit", async () => {
    vi.mocked(fetchMyListings).mockResolvedValueOnce({
      success: true,
      data: [makeListing({ id: "abc-123", title: "My Item" })],
      pagination,
    } as any)

    render(<MyListings />, { wrapper })

    expect(await screen.findByText("My Item")).toBeInTheDocument()

    const links = screen.getAllByRole("link")
    const detailLinks = links.filter((l) => l.getAttribute("href") === "/listings/abc-123")
    expect(detailLinks.length).toBeGreaterThanOrEqual(1)

    const editLink = links.find((l) => l.getAttribute("href") === "/listings/abc-123/edit")
    expect(editLink).toBeDefined()
    expect(editLink?.textContent).toBe("Edit")
  })

  it("shows pagination controls when totalPages > 1", async () => {
    vi.mocked(fetchMyListings).mockResolvedValueOnce({
      success: true,
      data: [makeListing()],
      pagination: { page: 1, limit: 10, total: 20, totalPages: 2 },
    } as any)

    render(<MyListings />, { wrapper })

    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument()
  })

  it("does not show pagination controls when totalPages is 1", async () => {
    vi.mocked(fetchMyListings).mockResolvedValueOnce({
      success: true,
      data: [makeListing()],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    } as any)

    render(<MyListings />, { wrapper })

    await screen.findByText("Vintage Watch")
    expect(screen.queryByText("Previous")).not.toBeInTheDocument()
  })

  it("shows loading skeleton while fetching", () => {
    vi.mocked(fetchMyListings).mockReturnValueOnce(new Promise(() => {}))

    render(<MyListings />, { wrapper })

    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("shows empty state with CTA when no listings", async () => {
    vi.mocked(fetchMyListings).mockResolvedValueOnce({
      success: true,
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    } as any)

    render(<MyListings />, { wrapper })

    expect(await screen.findByText(/haven't created any listings yet/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /create/i })).toBeInTheDocument()
  })

  it("shows error state with retry button when fetch fails", async () => {
    vi.mocked(fetchMyListings).mockResolvedValueOnce({
      success: false,
      error: "Failed to load your listings",
    } as any)

    render(<MyListings />, { wrapper })

    expect(await screen.findByText("Failed to load your listings")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
  })
})
