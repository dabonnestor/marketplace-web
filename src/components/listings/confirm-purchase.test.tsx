import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ConfirmPurchase } from "@/components/listings/confirm-purchase"
import type { Listing } from "@/lib/api/types"

const { mockPush, mockCreateOrder, mockSuccessToast, mockErrorToast } =
  vi.hoisted(() => ({
    mockPush: vi.fn(),
    mockCreateOrder: vi.fn(),
    mockSuccessToast: vi.fn(),
    mockErrorToast: vi.fn(),
  }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/actions/orders", () => ({
  createOrder: mockCreateOrder,
}))

vi.mock("sonner", () => ({
  toast: { success: mockSuccessToast, error: mockErrorToast },
}))

const listing: Listing = {
  id: "abc-123",
  sellerId: "seller-1",
  title: "Vintage Watch",
  description: "A beautiful vintage watch",
  price: "100.00",
  category: "Electronics",
  condition: "Like New",
  shippingCost: "7.50",
  images: [],
  status: "active",
  createdAt: "2025-01-01",
  updatedAt: "2025-01-02",
}

describe("ConfirmPurchase", () => {
  it("renders listing title and price breakdown with calculated totals", () => {
    render(
      <ConfirmPurchase listing={listing} currentUserId="buyer-99" />
    )

    expect(screen.getByText("Vintage Watch")).toBeInTheDocument()
    expect(screen.getByText("$100.00")).toBeInTheDocument()
    expect(screen.getByText("$7.50")).toBeInTheDocument()
    expect(screen.getByText("$5.00")).toBeInTheDocument()
    expect(screen.getByText("$112.50")).toBeInTheDocument()
  })

  it("shows not-available message when listing is already sold and hides confirm button", () => {
    const soldListing = { ...listing, status: "sold" as const }
    render(
      <ConfirmPurchase listing={soldListing} currentUserId="buyer-99" />
    )

    expect(
      screen.getByText(/no longer available/i)
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /confirm/i })
    ).not.toBeInTheDocument()
  })

  it("redirects unauthenticated user to login with return URL", () => {
    mockPush.mockClear()

    render(
      <ConfirmPurchase listing={listing} currentUserId={null} />
    )

    expect(mockPush).toHaveBeenCalledWith(
      `/login?redirect=/listings/${listing.id}/confirm`
    )
  })

  it("calls createOrder and redirects to order detail on success", async () => {
    const user = userEvent.setup()
    mockPush.mockClear()
    mockCreateOrder.mockClear()
    mockSuccessToast.mockClear()

    mockCreateOrder.mockResolvedValue({
      success: true,
      order: { id: "order-456" },
    })

    render(
      <ConfirmPurchase listing={listing} currentUserId="buyer-99" />
    )

    await user.click(
      screen.getByRole("button", { name: /confirm purchase/i })
    )

    expect(mockCreateOrder).toHaveBeenCalledWith(listing.id)
    expect(mockSuccessToast).toHaveBeenCalledWith("Order placed successfully")
    expect(mockPush).toHaveBeenCalledWith("/orders/order-456")
  })

  it("shows error toast and stays on page when createOrder fails", async () => {
    const user = userEvent.setup()
    mockPush.mockClear()
    mockCreateOrder.mockClear()
    mockErrorToast.mockClear()

    mockCreateOrder.mockResolvedValue({
      success: false,
      error: "Listing is no longer available",
    })

    render(
      <ConfirmPurchase listing={listing} currentUserId="buyer-99" />
    )

    await user.click(
      screen.getByRole("button", { name: /confirm purchase/i })
    )

    expect(mockErrorToast).toHaveBeenCalledWith("Listing is no longer available")
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("disables button and shows loading text while creating order", async () => {
    const user = userEvent.setup()
    // never resolves to keep component in pending state during assertions
    mockCreateOrder.mockReturnValue(new Promise(() => {}))

    render(
      <ConfirmPurchase listing={listing} currentUserId="buyer-99" />
    )

    const button = screen.getByRole("button", { name: /confirm purchase/i })
    await user.click(button)

    expect(
      screen.getByRole("button", { name: /confirming/i })
    ).toBeDisabled()
  })
})
