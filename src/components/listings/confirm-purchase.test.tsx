import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConfirmPurchase } from "@/components/listings/confirm-purchase"
import type { Listing } from "@/lib/api/types"

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})

function renderWithClient(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })
}

const {
  mockPush,
  mockReplace,
  mockCreateOrder,
  mockFetchOrder,
  mockSuccessToast,
  mockErrorToast,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
  mockCreateOrder: vi.fn(),
  mockFetchOrder: vi.fn(),
  mockSuccessToast: vi.fn(),
  mockErrorToast: vi.fn(),
}))

let searchParamsUrl = ""

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(searchParamsUrl),
}))

vi.mock("@/actions/orders", () => ({
  createOrder: mockCreateOrder,
  fetchOrder: mockFetchOrder,
}))

vi.mock(
  "@/components/checkout/stripe-payment-form",
  () => ({
    StripePaymentForm: ({
      onSuccess,
      orderId,
    }: {
      clientSecret: string
      orderId: string
      onSuccess: () => void
    }) => (
      <button onClick={onSuccess} data-testid="stripe-form">
        Mock StripePaymentForm
      </button>
    ),
  })
)

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

function resetMocks() {
  mockPush.mockReset()
  mockReplace.mockReset()
  mockCreateOrder.mockReset()
  mockFetchOrder.mockReset()
  mockSuccessToast.mockReset()
  mockErrorToast.mockReset()
  searchParamsUrl = ""
}

describe("ConfirmPurchase", () => {
  it("shows not-available message when listing is already sold", () => {
    const soldListing = { ...listing, status: "sold" as const }
    renderWithClient(
      <ConfirmPurchase listing={soldListing} currentUserId="buyer-99" />
    )

    expect(screen.getByText(/no longer available/i)).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /proceed/i })
    ).not.toBeInTheDocument()
  })

  it("redirects unauthenticated user to login with return URL", () => {
    resetMocks()
    renderWithClient(<ConfirmPurchase listing={listing} currentUserId={null} />)

    expect(mockPush).toHaveBeenCalledWith(
      `/login?redirect=/listings/${listing.id}/confirm`
    )
  })

  describe("step 1", () => {
    it("renders listing summary, platform fee note, and proceed button", () => {
      resetMocks()
      renderWithClient(
        <ConfirmPurchase listing={listing} currentUserId="buyer-99" />
      )

      expect(screen.getByText("Vintage Watch")).toBeInTheDocument()
      expect(screen.getByText("$100.00")).toBeInTheDocument()
      expect(screen.getByText(/platform fee/i)).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /proceed to payment/i })
      ).toBeInTheDocument()
    })

    it("does not show client-side calculated price breakdown in step 1", () => {
      resetMocks()
      renderWithClient(
        <ConfirmPurchase listing={listing} currentUserId="buyer-99" />
      )

      // No platform fee amount calculated client-side
      expect(screen.queryByText("$5.00")).not.toBeInTheDocument()
      expect(screen.queryByText("$112.50")).not.toBeInTheDocument()
      expect(screen.queryByText("Subtotal")).not.toBeInTheDocument()
    })

    it("calls createOrder, transitions to step 2, and updates URL on success", async () => {
      const user = userEvent.setup()
      resetMocks()

      mockCreateOrder.mockResolvedValue({
        success: true,
        order: {
          id: "order-456",
          subtotal: "100.00",
          shippingCost: "7.50",
          platformFee: "10.00",
          total: "117.50",
          clientSecret: "cs_test_123",
        },
      })

      renderWithClient(
        <ConfirmPurchase listing={listing} currentUserId="buyer-99" />
      )

      await user.click(
        screen.getByRole("button", { name: /proceed to payment/i })
      )

      expect(mockCreateOrder).toHaveBeenCalledWith(listing.id)
      expect(mockReplace).toHaveBeenCalledWith("?orderId=order-456")
      // Step 2: should show server-computed price breakdown
      expect(screen.getByText("$100.00")).toBeInTheDocument()
      expect(screen.getByText("$10.00")).toBeInTheDocument()
      expect(screen.getByText("$117.50")).toBeInTheDocument()
      expect(screen.getByTestId("stripe-form")).toBeInTheDocument()
    })

    it("shows error toast and stays on step 1 when createOrder fails", async () => {
      const user = userEvent.setup()
      resetMocks()

      mockCreateOrder.mockResolvedValue({
        success: false,
        error: "Listing is no longer available",
      })

      renderWithClient(
        <ConfirmPurchase listing={listing} currentUserId="buyer-99" />
      )

      await user.click(
        screen.getByRole("button", { name: /proceed to payment/i })
      )

      expect(mockErrorToast).toHaveBeenCalledWith(
        "Listing is no longer available"
      )
      // Still on step 1
      expect(
        screen.getByRole("button", { name: /proceed to payment/i })
      ).toBeInTheDocument()
      expect(mockReplace).not.toHaveBeenCalled()
    })

    it("disables button and shows loading text while creating order", async () => {
      const user = userEvent.setup()
      resetMocks()

      mockCreateOrder.mockReturnValue(new Promise(() => {}))

      renderWithClient(
        <ConfirmPurchase listing={listing} currentUserId="buyer-99" />
      )

      await user.click(
        screen.getByRole("button", { name: /proceed to payment/i })
      )

      expect(
        screen.getByRole("button", { name: /creating/i })
      ).toBeDisabled()
    })
  })

  describe("step 2", () => {
    it("redirects to order detail when StripePaymentForm calls onSuccess", async () => {
      const user = userEvent.setup()
      resetMocks()

      mockCreateOrder.mockResolvedValue({
        success: true,
        order: {
          id: "order-456",
          subtotal: "100.00",
          shippingCost: "7.50",
          platformFee: "10.00",
          total: "117.50",
          clientSecret: "cs_test_123",
        },
      })

      renderWithClient(
        <ConfirmPurchase listing={listing} currentUserId="buyer-99" />
      )

      // Go to step 2
      await user.click(
        screen.getByRole("button", { name: /proceed to payment/i })
      )

      // Click the mocked StripePaymentForm onSuccess trigger
      await user.click(screen.getByTestId("stripe-form"))

      expect(mockPush).toHaveBeenCalledWith("/orders/order-456")
    })
  })

  describe("refresh recovery", () => {
    it("shows step 2 when orderId is pending", async () => {
      resetMocks()
      searchParamsUrl = "orderId=order-456"

      mockFetchOrder.mockResolvedValue({
        success: true,
        order: {
          id: "order-456",
          status: "pending",
          subtotal: "100.00",
          shippingCost: "7.50",
          platformFee: "10.00",
          total: "117.50",
          clientSecret: "cs_test_123",
        },
      })

      renderWithClient(
        <ConfirmPurchase listing={listing} currentUserId="buyer-99" />
      )

      expect(mockFetchOrder).toHaveBeenCalledWith("order-456")
      expect(await screen.findByTestId("stripe-form")).toBeInTheDocument()
      expect(screen.getByText("$100.00")).toBeInTheDocument()
      expect(screen.getByText("$10.00")).toBeInTheDocument()
      expect(screen.getByText("$117.50")).toBeInTheDocument()
    })

    it("redirects to order detail when order is already terminal", async () => {
      resetMocks()
      searchParamsUrl = "orderId=order-789"

      mockFetchOrder.mockResolvedValue({
        success: true,
        order: {
          id: "order-789",
          status: "paid",
          subtotal: "100.00",
          shippingCost: "7.50",
          platformFee: "10.00",
          total: "117.50",
        },
      })

      renderWithClient(
        <ConfirmPurchase listing={listing} currentUserId="buyer-99" />
      )

      expect(mockFetchOrder).toHaveBeenCalledWith("order-789")
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/orders/order-789")
      })
    })

    it("shows error and falls back to step 1 when fetchOrder fails", async () => {
      resetMocks()
      searchParamsUrl = "orderId=bad-order"

      mockFetchOrder.mockResolvedValue({
        success: false,
        error: "Order not found",
      })

      renderWithClient(
        <ConfirmPurchase listing={listing} currentUserId="buyer-99" />
      )

      await waitFor(() => {
        expect(mockErrorToast).toHaveBeenCalledWith("Order not found")
      })
      expect(
        await screen.findByRole("button", { name: /proceed to payment/i })
      ).toBeInTheDocument()
    })
  })
})
