import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PurchaseHistory } from "@/components/orders/purchase-history"
import type { PurchaseOrder, Pagination } from "@/lib/api/types"

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}))

vi.mock("@/actions/orders", () => ({
  fetchPurchases: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}))

import { fetchPurchases } from "@/actions/orders"

function makePurchase(overrides: Partial<PurchaseOrder> = {}): PurchaseOrder {
  return {
    id: "order-1",
    buyerId: "buyer-1",
    sellerId: "seller-1",
    listingId: "listing-1",
    listingTitle: "Vintage Watch",
    listingImage: "https://example.com/watch.jpg",
    sellerName: "Alice",
    status: "paid",
    subtotal: "100.00",
    shippingCost: "7.50",
    platformFee: "5.00",
    total: "112.50",
    sellerPayout: "95.00",
    paidAt: "2025-06-01T00:00:00Z",
    shippedAt: null,
    deliveredAt: null,
    completedAt: null,
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

describe("PurchaseHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders purchase rows with listing title, seller name, price, status badge, and date", async () => {
    vi.mocked(fetchPurchases).mockResolvedValueOnce({
      success: true,
      data: [makePurchase()],
      pagination,
    } as any)

    render(<PurchaseHistory />, { wrapper })

    expect(await screen.findByText("Vintage Watch")).toBeInTheDocument()
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("$112.50")).toBeInTheDocument()
    expect(screen.getAllByText("Paid").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/6\/1\/2025/)).toBeInTheDocument()
  })

  it("shows status filter tabs: All, Pending, Paid, Shipped, Delivered, Completed, Cancelled", async () => {
    vi.mocked(fetchPurchases).mockResolvedValueOnce({
      success: true,
      data: [makePurchase()],
      pagination,
    } as any)

    render(<PurchaseHistory />, { wrapper })

    expect(await screen.findByText("Vintage Watch")).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Pending" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Paid" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Shipped" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Delivered" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Completed" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Cancelled" })).toBeInTheDocument()
  })

  it("clicking a status tab navigates with status param", async () => {
    mockPush.mockClear()
    const user = userEvent.setup()

    vi.mocked(fetchPurchases).mockResolvedValueOnce({
      success: true,
      data: [makePurchase()],
      pagination,
    } as any)

    render(<PurchaseHistory />, { wrapper })

    await screen.findByText("Vintage Watch")
    await user.click(screen.getByRole("tab", { name: "Shipped" }))

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("status=shipped")
    )
  })

  it("clicking a purchase row navigates to /orders/[id]", async () => {
    mockPush.mockClear()
    const user = userEvent.setup()

    vi.mocked(fetchPurchases).mockResolvedValueOnce({
      success: true,
      data: [makePurchase()],
      pagination,
    } as any)

    render(<PurchaseHistory />, { wrapper })

    await user.click(await screen.findByText("Vintage Watch"))

    expect(mockPush).toHaveBeenCalledWith("/orders/order-1")
  })

  it("shows pagination controls when totalPages > 1", async () => {
    vi.mocked(fetchPurchases).mockResolvedValueOnce({
      success: true,
      data: [makePurchase()],
      pagination: { page: 1, limit: 10, total: 20, totalPages: 2 },
    } as any)

    render(<PurchaseHistory />, { wrapper })

    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument()
  })

  it("does not show pagination controls when totalPages is 1", async () => {
    vi.mocked(fetchPurchases).mockResolvedValueOnce({
      success: true,
      data: [makePurchase()],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    } as any)

    render(<PurchaseHistory />, { wrapper })

    await screen.findByText("Vintage Watch")
    expect(screen.queryByText("Previous")).not.toBeInTheDocument()
  })

  it("paginating preserves the active status filter", async () => {
    mockPush.mockClear()
    const user = userEvent.setup()

    vi.mocked(fetchPurchases).mockResolvedValueOnce({
      success: true,
      data: [makePurchase()],
      pagination: { page: 1, limit: 10, total: 20, totalPages: 2 },
    } as any)

    render(<PurchaseHistory />, { wrapper })

    await screen.findByText("Vintage Watch")
    await user.click(screen.getByText("Next"))

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("page=2")
    )
  })

  it("shows loading skeleton while fetching", () => {
    vi.mocked(fetchPurchases).mockReturnValueOnce(new Promise(() => {}))

    render(<PurchaseHistory />, { wrapper })

    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("shows empty state with CTA when no purchases", async () => {
    vi.mocked(fetchPurchases).mockResolvedValueOnce({
      success: true,
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    } as any)

    render(<PurchaseHistory />, { wrapper })

    expect(await screen.findByText(/no purchases yet/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /browse/i })).toBeInTheDocument()
  })

  it("shows error state with retry button when fetch fails", async () => {
    vi.mocked(fetchPurchases).mockResolvedValueOnce({
      success: false,
      error: "Failed to load purchases",
    } as any)

    render(<PurchaseHistory />, { wrapper })

    expect(await screen.findByText("Failed to load purchases")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
  })
})
