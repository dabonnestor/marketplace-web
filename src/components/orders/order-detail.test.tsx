import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { OrderDetail } from "./order-detail"
import type { Order, Listing } from "@/lib/api/types"

const {
  mockPush,
  mockUpdateOrderStatus,
  mockCancelOrder,
  mockRefundOrder,
  mockCompleteOrder,
  mockFetchOrder,
  mockInvalidateQueries,
  mockSuccessToast,
  mockErrorToast,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockUpdateOrderStatus: vi.fn(),
  mockCancelOrder: vi.fn(),
  mockRefundOrder: vi.fn(),
  mockCompleteOrder: vi.fn(),
  mockFetchOrder: vi.fn(),
  mockInvalidateQueries: vi.fn(),
  mockSuccessToast: vi.fn(),
  mockErrorToast: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/actions/orders", () => ({
  fetchOrder: mockFetchOrder,
  updateOrderStatus: mockUpdateOrderStatus,
  cancelOrder: mockCancelOrder,
  refundOrder: mockRefundOrder,
  completeOrder: mockCompleteOrder,
}))

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ initialData }: { initialData?: unknown }) => ({
    data: initialData,
    isLoading: false,
  }),
  useMutation: ({ mutationFn, onSuccess, onError }: {
    mutationFn: (...args: any[]) => Promise<any>
    onSuccess?: (result: any, variables: any) => void
    onError?: (error: Error) => void
  }) => ({
    mutate: (variables?: unknown) => {
      Promise.resolve(mutationFn(variables)).then(
        (result) => onSuccess?.(result, variables as any),
        (error) => onError?.(error as Error),
      )
    },
    isPending: false,
  }),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}))

vi.mock("sonner", () => ({
  toast: { success: mockSuccessToast, error: mockErrorToast },
}))

vi.mock("@/components/checkout/stripe-payment-form", () => ({
  StripePaymentForm: ({
    onSuccess,
  }: {
    clientSecret: string
    orderId: string
    onSuccess: () => void
  }) => (
    <div data-testid="stripe-payment-form">
      <button onClick={onSuccess}>Mock Complete Payment</button>
    </div>
  ),
}))

const listing: Listing = {
  id: "listing-1",
  sellerId: "seller-1",
  title: "Vintage Watch",
  description: "A beautiful vintage watch",
  price: "100.00",
  category: "Electronics",
  condition: "Like New",
  shippingCost: "7.50",
  images: ["https://example.com/watch.jpg"],
  status: "sold",
  createdAt: "2025-01-01",
  updatedAt: "2025-01-02",
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    buyerId: "buyer-1",
    sellerId: "seller-1",
    listingId: "listing-1",
    status: "pending",
    subtotal: "100.00",
    shippingCost: "7.50",
    platformFee: "5.00",
    total: "112.50",
    sellerPayout: "95.00",
    paidAt: null,
    shippedAt: null,
    deliveredAt: null,
    completedAt: null,
    createdAt: "2025-06-01T00:00:00Z",
    updatedAt: "2025-06-01T00:00:00Z",
    ...overrides,
  }
}

describe("OrderDetail", () => {
  it("renders listing image", () => {
    render(
      <OrderDetail
        order={makeOrder()}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    const img = screen.getByRole("img", { name: listing.title })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute("src", listing.images[0])
  })

  it("renders listing title", () => {
    render(
      <OrderDetail
        order={makeOrder()}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(screen.getByText("Vintage Watch")).toBeInTheDocument()
  })

  it("renders price breakdown", () => {
    render(
      <OrderDetail
        order={makeOrder()}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(screen.getByText("$100.00")).toBeInTheDocument()
    expect(screen.getByText("$7.50")).toBeInTheDocument()
    expect(screen.getByText("$112.50")).toBeInTheDocument()
    // Platform fee should not be shown to buyer
    expect(screen.queryByText("$5.00")).not.toBeInTheDocument()
  })

  it("renders price breakdown for seller with platform fee deduction", () => {
    render(
      <OrderDetail
        order={makeOrder()}
        listing={listing}
        currentUserId="seller-1"
      />
    )
    expect(screen.getByText("$100.00")).toBeInTheDocument()
    // Platform fee shown as deduction
    expect(screen.getByText("-$5.00")).toBeInTheDocument()
    // Total = sellerPayout
    expect(screen.getByText("$95.00")).toBeInTheDocument()
    // Shipping should not be shown to seller
    expect(screen.queryByText("$7.50")).not.toBeInTheDocument()
  })

  it("renders color-coded status badge", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "cancelled" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(screen.getByText("Cancelled")).toBeInTheDocument()
  })

  it("renders status progress steps", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "shipped" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(screen.getByText(/pending/i)).toBeInTheDocument()
    expect(screen.getByText(/paid/i)).toBeInTheDocument()
    expect(screen.getAllByText(/shipped/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/delivered/i)).toBeInTheDocument()
    expect(screen.getByText(/completed/i)).toBeInTheDocument()
  })

  it("buyer of pending order sees no transition action buttons", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "pending" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.queryByRole("button", { name: /mark as/i })
    ).not.toBeInTheDocument()
  })

  it("buyer of delivered order sees Mark as Completed button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "delivered" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.getByRole("button", { name: /mark as completed/i })
    ).toBeInTheDocument()
  })

  it("seller of paid order sees Mark as Shipped button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "paid" })}
        listing={listing}
        currentUserId="seller-1"
      />
    )
    expect(
      screen.getByRole("button", { name: /mark as shipped/i })
    ).toBeInTheDocument()
  })

  it("seller of shipped order sees Mark as Delivered button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "shipped" })}
        listing={listing}
        currentUserId="seller-1"
      />
    )
    expect(
      screen.getByRole("button", { name: /mark as delivered/i })
    ).toBeInTheDocument()
  })

  it("buyer of paid order sees no action buttons", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "paid" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.queryByRole("button", { name: /mark as/i })
    ).not.toBeInTheDocument()
  })

  it("shows no action buttons for completed order", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "completed" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.queryByRole("button", { name: /mark as/i })
    ).not.toBeInTheDocument()
  })

  it("non-participant sees no action buttons", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "pending" })}
        listing={listing}
        currentUserId="stranger"
      />
    )
    expect(
      screen.queryByRole("button", { name: /mark as/i })
    ).not.toBeInTheDocument()
  })

  it("redirects unauthenticated user to login with return URL", () => {
    mockPush.mockClear()

    render(
      <OrderDetail
        order={makeOrder()}
        listing={listing}
        currentUserId={null}
      />
    )

    expect(mockPush).toHaveBeenCalledWith(
      `/login?redirect=/orders/${makeOrder().id}`
    )
  })

  it("shows order ID", () => {
    render(
      <OrderDetail
        order={makeOrder()}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(screen.getByText(/order-1/i)).toBeInTheDocument()
  })
})

describe("OrderDetail Cancel button", () => {
  it("buyer of pending order sees Cancel Order button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "pending" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.getByRole("button", { name: /cancel order/i })
    ).toBeInTheDocument()
  })

  it("buyer of paid order does not see Cancel Order button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "paid" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.queryByRole("button", { name: /cancel order/i })
    ).not.toBeInTheDocument()
  })

  it("buyer of shipped order does not see Cancel Order button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "shipped" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.queryByRole("button", { name: /cancel order/i })
    ).not.toBeInTheDocument()
  })

  it("seller does not see Cancel Order button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "pending" })}
        listing={listing}
        currentUserId="seller-1"
      />
    )
    expect(
      screen.queryByRole("button", { name: /cancel order/i })
    ).not.toBeInTheDocument()
  })
})

describe("OrderDetail Refund button", () => {
  it("buyer of paid order sees Request a Refund button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "paid" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.getByRole("button", { name: /request a refund/i })
    ).toBeInTheDocument()
  })

  it("buyer of shipped order sees Request a Refund button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "shipped" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.getByRole("button", { name: /request a refund/i })
    ).toBeInTheDocument()
  })

  it("buyer of delivered order sees Request a Refund button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "delivered" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.getByRole("button", { name: /request a refund/i })
    ).toBeInTheDocument()
  })

  it("buyer of pending order does not see Request a Refund button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "pending" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.queryByRole("button", { name: /request a refund/i })
    ).not.toBeInTheDocument()
  })

  it("seller does not see Request a Refund button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "paid" })}
        listing={listing}
        currentUserId="seller-1"
      />
    )
    expect(
      screen.queryByRole("button", { name: /request a refund/i })
    ).not.toBeInTheDocument()
  })
})

describe("OrderDetail payment fallback", () => {
  it("shows Complete Payment button for pending order viewed by buyer", () => {
    render(
      <OrderDetail
        order={makeOrder({
          status: "pending",
          clientSecret: "pi_secret_123",
        })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.getByRole("button", { name: /complete payment/i })
    ).toBeInTheDocument()
  })

  it("does not show Complete Payment button for pending order without clientSecret", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "pending" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.queryByRole("button", { name: /complete payment/i })
    ).not.toBeInTheDocument()
  })

  it("does not show Complete Payment button for seller viewing pending order", () => {
    render(
      <OrderDetail
        order={makeOrder({
          status: "pending",
          clientSecret: "pi_secret_123",
        })}
        listing={listing}
        currentUserId="seller-1"
      />
    )
    expect(
      screen.queryByRole("button", { name: /complete payment/i })
    ).not.toBeInTheDocument()
  })

  it("does not show Complete Payment button for non-pending order", () => {
    render(
      <OrderDetail
        order={makeOrder({
          status: "paid",
          clientSecret: "pi_secret_123",
        })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.queryByRole("button", { name: /complete payment/i })
    ).not.toBeInTheDocument()
  })

  it("renders StripePaymentForm when Complete Payment is clicked", async () => {
    const user = userEvent.setup()
    render(
      <OrderDetail
        order={makeOrder({
          status: "pending",
          clientSecret: "pi_secret_123",
        })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    await user.click(
      screen.getByRole("button", { name: /complete payment/i })
    )
    expect(screen.getByTestId("stripe-payment-form")).toBeInTheDocument()
  })

  it("calls invalidateQueries after successful payment", async () => {
    const user = userEvent.setup()
    mockInvalidateQueries.mockClear()

    render(
      <OrderDetail
        order={makeOrder({
          status: "pending",
          clientSecret: "pi_secret_123",
        })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    await user.click(
      screen.getByRole("button", { name: /complete payment/i })
    )
    await user.click(
      screen.getByRole("button", { name: /mock complete payment/i })
    )

    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["order", "order-1"] })
    )
  })
})

describe("OrderDetail Cancel confirmation dialog", () => {
  it("opens confirmation dialog when Cancel Order is clicked", async () => {
    const user = userEvent.setup()
    render(
      <OrderDetail
        order={makeOrder({ status: "pending" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    await user.click(screen.getByRole("button", { name: /cancel order/i }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(
      screen.getByText(/are you sure you want to cancel this order\?/i)
    ).toBeInTheDocument()
  })

  it("calls cancelOrder and shows success toast on confirm", async () => {
    const user = userEvent.setup()
    mockCancelOrder.mockClear()
    mockSuccessToast.mockClear()

    mockCancelOrder.mockResolvedValue({
      success: true,
      order: makeOrder({ status: "cancelled" }),
    })

    render(
      <OrderDetail
        order={makeOrder({ status: "pending" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    await user.click(screen.getByRole("button", { name: /cancel order/i }))
    await user.click(screen.getByRole("button", { name: /confirm/i }))

    expect(mockCancelOrder).toHaveBeenCalledWith("order-1")
    expect(mockSuccessToast).toHaveBeenCalled()
  })

  it("shows error toast when cancelOrder fails", async () => {
    const user = userEvent.setup()
    mockCancelOrder.mockClear()
    mockErrorToast.mockClear()

    mockCancelOrder.mockResolvedValue({
      success: false,
      error: "Cannot cancel this order",
    })

    render(
      <OrderDetail
        order={makeOrder({ status: "pending" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    await user.click(screen.getByRole("button", { name: /cancel order/i }))
    await user.click(screen.getByRole("button", { name: /confirm/i }))

    expect(mockErrorToast).toHaveBeenCalledWith("Cannot cancel this order")
  })
})

describe("OrderDetail Refund confirmation dialog", () => {
  it("opens confirmation dialog when Request a Refund is clicked", async () => {
    const user = userEvent.setup()
    render(
      <OrderDetail
        order={makeOrder({ status: "paid" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    await user.click(screen.getByRole("button", { name: /request a refund/i }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(
      screen.getByText(/are you sure you want to request a refund for this order\?/i)
    ).toBeInTheDocument()
  })

  it("calls refundOrder and shows success toast on confirm", async () => {
    const user = userEvent.setup()
    mockRefundOrder.mockClear()
    mockSuccessToast.mockClear()

    mockRefundOrder.mockResolvedValue({
      success: true,
      order: makeOrder({ status: "refunded" }),
    })

    render(
      <OrderDetail
        order={makeOrder({ status: "paid" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    await user.click(screen.getByRole("button", { name: /request a refund/i }))
    await user.click(screen.getByRole("button", { name: /confirm/i }))

    expect(mockRefundOrder).toHaveBeenCalledWith("order-1")
    expect(mockSuccessToast).toHaveBeenCalled()
  })

  it("shows error toast when refundOrder fails", async () => {
    const user = userEvent.setup()
    mockRefundOrder.mockClear()
    mockErrorToast.mockClear()

    mockRefundOrder.mockResolvedValue({
      success: false,
      error: "Cannot refund this order",
    })

    render(
      <OrderDetail
        order={makeOrder({ status: "paid" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    await user.click(screen.getByRole("button", { name: /request a refund/i }))
    await user.click(screen.getByRole("button", { name: /confirm/i }))

    expect(mockErrorToast).toHaveBeenCalledWith("Cannot refund this order")
  })
})

describe("OrderDetail confirmation dialog", () => {
  it("opens dialog when action button is clicked", async () => {
    const user = userEvent.setup()
    render(
      <OrderDetail
        order={makeOrder({ status: "paid" })}
        listing={listing}
        currentUserId="seller-1"
      />
    )
    await user.click(screen.getByRole("button", { name: /mark as shipped/i }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(
      screen.getByText(/are you sure you want to mark this order as shipped\?/i)
    ).toBeInTheDocument()
  })

  it("shows transfer notice when completing order", async () => {
    const user = userEvent.setup()
    render(
      <OrderDetail
        order={makeOrder({ status: "delivered" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    await user.click(
      screen.getByRole("button", { name: /mark as completed/i })
    )
    expect(
      screen.getByText(/this transfers payment to the seller/i)
    ).toBeInTheDocument()
  })

  it("calls updateOrderStatus and shows success toast on confirm", async () => {
    const user = userEvent.setup()
    mockUpdateOrderStatus.mockClear()
    mockSuccessToast.mockClear()

    mockUpdateOrderStatus.mockResolvedValue({
      success: true,
      order: makeOrder({ status: "shipped" }),
    })

    render(
      <OrderDetail
        order={makeOrder({ status: "paid" })}
        listing={listing}
        currentUserId="seller-1"
      />
    )
    await user.click(screen.getByRole("button", { name: /mark as shipped/i }))
    await user.click(screen.getByRole("button", { name: /confirm/i }))

    expect(mockUpdateOrderStatus).toHaveBeenCalledWith("order-1", {
      status: "shipped",
    })
    expect(mockSuccessToast).toHaveBeenCalled()
  })

  it("shows error toast when update fails", async () => {
    const user = userEvent.setup()
    mockUpdateOrderStatus.mockClear()
    mockErrorToast.mockClear()

    mockUpdateOrderStatus.mockResolvedValue({
      success: false,
      error: "Transition not allowed",
    })

    render(
      <OrderDetail
        order={makeOrder({ status: "paid" })}
        listing={listing}
        currentUserId="seller-1"
      />
    )
    await user.click(screen.getByRole("button", { name: /mark as shipped/i }))
    await user.click(screen.getByRole("button", { name: /confirm/i }))

    expect(mockErrorToast).toHaveBeenCalledWith("Transition not allowed")
  })

  it("closes dialog when cancel is clicked without calling action", async () => {
    const user = userEvent.setup()
    mockUpdateOrderStatus.mockClear()

    render(
      <OrderDetail
        order={makeOrder({ status: "paid" })}
        listing={listing}
        currentUserId="seller-1"
      />
    )
    await user.click(screen.getByRole("button", { name: /mark as shipped/i }))
    await user.click(screen.getByRole("button", { name: /cancel/i }))

    expect(mockUpdateOrderStatus).not.toHaveBeenCalled()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("calls completeOrder when marking as completed", async () => {
    const user = userEvent.setup()
    mockCompleteOrder.mockClear()
    mockSuccessToast.mockClear()

    mockCompleteOrder.mockResolvedValue({
      success: true,
      order: makeOrder({ status: "completed" }),
    })

    render(
      <OrderDetail
        order={makeOrder({ status: "delivered" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    await user.click(
      screen.getByRole("button", { name: /mark as completed/i })
    )
    await user.click(screen.getByRole("button", { name: /confirm/i }))

    expect(mockCompleteOrder).toHaveBeenCalledWith("order-1")
    expect(mockUpdateOrderStatus).not.toHaveBeenCalled()
    expect(mockSuccessToast).toHaveBeenCalled()
  })
})
