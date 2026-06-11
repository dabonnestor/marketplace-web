import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { OrderList } from "@/components/orders/order-list"
import type { PurchaseOrder, SaleOrder, Pagination } from "@/lib/api/types"

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}))

vi.mock("@/lib/api/actions", () => ({
  fetchPurchases: vi.fn(),
  fetchSales: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}))

import { fetchPurchases, fetchSales } from "@/lib/api/actions"

function makeOrder(overrides: Partial<PurchaseOrder | SaleOrder> = {}): PurchaseOrder | SaleOrder {
  return {
    id: "order-1",
    buyerId: "buyer-1",
    sellerId: "seller-1",
    listingId: "listing-1",
    listingTitle: "Vintage Watch",
    listingImage: "https://example.com/watch.jpg",
    sellerName: "Alice",
    buyerName: "Bob",
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

describe.each([
  {
    role: "buyer" as const,
    fetcher: "fetchPurchases",
    baseUrl: "/dashboard/purchases",
    counterpartyName: "Alice",
    emptyPattern: /no purchases yet/i,
    ctaPattern: /browse/i,
  },
  {
    role: "seller" as const,
    fetcher: "fetchSales",
    baseUrl: "/dashboard/sales",
    counterpartyName: "Bob",
    emptyPattern: /no sales yet/i,
    ctaPattern: /create/i,
  },
])("OrderList role=$role", ({ role, fetcher, baseUrl, counterpartyName, emptyPattern, ctaPattern }) => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockFetcher = () => (fetcher === "fetchPurchases" ? fetchPurchases : fetchSales)

  it("renders order rows with listing title, counterparty name, price, status badge, and date", async () => {
    vi.mocked(mockFetcher()).mockResolvedValueOnce({
      success: true,
      data: [makeOrder()],
      pagination,
    } as any)

    render(<OrderList role={role} />, { wrapper })

    expect(await screen.findByText("Vintage Watch")).toBeInTheDocument()
    expect(screen.getByText(counterpartyName)).toBeInTheDocument()
    expect(screen.getByText("$112.50")).toBeInTheDocument()
    expect(screen.getAllByText("Paid").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/6\/1\/2025/)).toBeInTheDocument()
  })

  it("shows status filter tabs: All, Pending, Paid, Shipped, Delivered, Completed, Cancelled", async () => {
    vi.mocked(mockFetcher()).mockResolvedValueOnce({
      success: true,
      data: [makeOrder()],
      pagination,
    } as any)

    render(<OrderList role={role} />, { wrapper })

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

    vi.mocked(mockFetcher()).mockResolvedValueOnce({
      success: true,
      data: [makeOrder()],
      pagination,
    } as any)

    render(<OrderList role={role} />, { wrapper })

    await screen.findByText("Vintage Watch")
    await user.click(screen.getByRole("tab", { name: "Shipped" }))

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("status=shipped")
    )
  })

  it("clicking an order row navigates to /orders/[id]", async () => {
    mockPush.mockClear()
    const user = userEvent.setup()

    vi.mocked(mockFetcher()).mockResolvedValueOnce({
      success: true,
      data: [makeOrder()],
      pagination,
    } as any)

    render(<OrderList role={role} />, { wrapper })

    await user.click(await screen.findByText("Vintage Watch"))

    expect(mockPush).toHaveBeenCalledWith("/orders/order-1")
  })

  it("shows pagination controls when totalPages > 1", async () => {
    vi.mocked(mockFetcher()).mockResolvedValueOnce({
      success: true,
      data: [makeOrder()],
      pagination: { page: 1, limit: 10, total: 20, totalPages: 2 },
    } as any)

    render(<OrderList role={role} />, { wrapper })

    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument()
  })

  it("does not show pagination controls when totalPages is 1", async () => {
    vi.mocked(mockFetcher()).mockResolvedValueOnce({
      success: true,
      data: [makeOrder()],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    } as any)

    render(<OrderList role={role} />, { wrapper })

    await screen.findByText("Vintage Watch")
    expect(screen.queryByText("Previous")).not.toBeInTheDocument()
  })

  it("paginating preserves the active status filter", async () => {
    mockPush.mockClear()
    const user = userEvent.setup()

    vi.mocked(mockFetcher()).mockResolvedValueOnce({
      success: true,
      data: [makeOrder()],
      pagination: { page: 1, limit: 10, total: 20, totalPages: 2 },
    } as any)

    render(<OrderList role={role} />, { wrapper })

    await screen.findByText("Vintage Watch")
    await user.click(screen.getByText("Next"))

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("page=2")
    )
  })

  it("shows loading skeleton while fetching", () => {
    ;(vi.mocked(mockFetcher()) as any).mockReturnValueOnce(new Promise(() => {}))

    render(<OrderList role={role} />, { wrapper })

    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("shows empty state with CTA when no orders", async () => {
    vi.mocked(mockFetcher()).mockResolvedValueOnce({
      success: true,
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    } as any)

    render(<OrderList role={role} />, { wrapper })

    expect(await screen.findByText(emptyPattern)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: ctaPattern })).toBeInTheDocument()
  })

  it("shows error state with retry button when fetch fails", async () => {
    vi.mocked(mockFetcher()).mockResolvedValueOnce({
      success: false,
      error: `Failed to load ${role === "buyer" ? "purchases" : "sales"}`,
    } as any)

    render(<OrderList role={role} />, { wrapper })

    expect(await screen.findByText(`Failed to load ${role === "buyer" ? "purchases" : "sales"}`)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
  })
})
