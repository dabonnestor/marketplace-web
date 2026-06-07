import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { OrderDetail } from "./order-detail"
import type { Order, Listing } from "@/lib/api/types"

const { mockPush, mockRefresh, mockUpdateOrderStatus, mockCancelOrder, mockRefundOrder, mockSuccessToast, mockErrorToast } =
  vi.hoisted(() => ({
    mockPush: vi.fn(),
    mockRefresh: vi.fn(),
    mockUpdateOrderStatus: vi.fn(),
    mockCancelOrder: vi.fn(),
    mockRefundOrder: vi.fn(),
    mockSuccessToast: vi.fn(),
    mockErrorToast: vi.fn(),
  }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

vi.mock("@/actions/orders", () => ({
  updateOrderStatus: mockUpdateOrderStatus,
  cancelOrder: mockCancelOrder,
  refundOrder: mockRefundOrder,
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
    expect(screen.getByText("$5.00")).toBeInTheDocument()
    expect(screen.getByText("$112.50")).toBeInTheDocument()
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

  it("buyer of pending order sees Mark as Paid button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "pending" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.getByRole("button", { name: /mark as paid/i })
    ).toBeInTheDocument()
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

  it("buyer of paid order sees Cancel Order button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "paid" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.getByRole("button", { name: /cancel order/i })
    ).toBeInTheDocument()
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
  it("buyer of paid order sees Refund Order button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "paid" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.getByRole("button", { name: /refund order/i })
    ).toBeInTheDocument()
  })

  it("buyer of shipped order sees Refund Order button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "shipped" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.getByRole("button", { name: /refund order/i })
    ).toBeInTheDocument()
  })

  it("buyer of delivered order sees Refund Order button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "delivered" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.getByRole("button", { name: /refund order/i })
    ).toBeInTheDocument()
  })

  it("buyer of pending order does not see Refund Order button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "pending" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(
      screen.queryByRole("button", { name: /refund order/i })
    ).not.toBeInTheDocument()
  })

  it("seller does not see Refund Order button", () => {
    render(
      <OrderDetail
        order={makeOrder({ status: "paid" })}
        listing={listing}
        currentUserId="seller-1"
      />
    )
    expect(
      screen.queryByRole("button", { name: /refund order/i })
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

  it("calls router.refresh after successful payment", async () => {
    const user = userEvent.setup()
    mockRefresh.mockClear()

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

    expect(mockRefresh).toHaveBeenCalled()
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
  it("opens confirmation dialog when Refund Order is clicked", async () => {
    const user = userEvent.setup()
    render(
      <OrderDetail
        order={makeOrder({ status: "paid" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    await user.click(screen.getByRole("button", { name: /refund order/i }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(
      screen.getByText(/are you sure you want to refund this order\?/i)
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
    await user.click(screen.getByRole("button", { name: /refund order/i }))
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
    await user.click(screen.getByRole("button", { name: /refund order/i }))
    await user.click(screen.getByRole("button", { name: /confirm/i }))

    expect(mockErrorToast).toHaveBeenCalledWith("Cannot refund this order")
  })
})

describe("OrderDetail polling", () => {
  it("sets up 30-second interval for non-terminal order", () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval")
    render(
      <OrderDetail
        order={makeOrder({ status: "pending" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(setIntervalSpy).toHaveBeenCalledWith(
      expect.any(Function),
      30000,
    )
    setIntervalSpy.mockRestore()
  })

  it("does not set up interval for terminal completed status", () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval")
    render(
      <OrderDetail
        order={makeOrder({ status: "completed" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(setIntervalSpy).not.toHaveBeenCalled()
    setIntervalSpy.mockRestore()
  })

  it("does not set up interval for terminal cancelled status", () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval")
    render(
      <OrderDetail
        order={makeOrder({ status: "cancelled" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(setIntervalSpy).not.toHaveBeenCalled()
    setIntervalSpy.mockRestore()
  })

  it("does not set up interval for terminal expired status", () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval")
    render(
      <OrderDetail
        order={makeOrder({ status: "expired" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(setIntervalSpy).not.toHaveBeenCalled()
    setIntervalSpy.mockRestore()
  })

  it("does not set up interval for terminal refunded status", () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval")
    render(
      <OrderDetail
        order={makeOrder({ status: "refunded" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    expect(setIntervalSpy).not.toHaveBeenCalled()
    setIntervalSpy.mockRestore()
  })

  it("clears interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval")
    const { unmount } = render(
      <OrderDetail
        order={makeOrder({ status: "pending" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    unmount()
    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })
})

describe("OrderDetail confirmation dialog", () => {
  it("opens dialog when action button is clicked", async () => {
    const user = userEvent.setup()
    render(
      <OrderDetail
        order={makeOrder({ status: "pending" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    await user.click(screen.getByRole("button", { name: /mark as paid/i }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(
      screen.getByText(/are you sure you want to mark this order as paid\?/i)
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
      order: makeOrder({ status: "paid" }),
    })

    render(
      <OrderDetail
        order={makeOrder({ status: "pending" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    await user.click(screen.getByRole("button", { name: /mark as paid/i }))
    await user.click(screen.getByRole("button", { name: /confirm/i }))

    expect(mockUpdateOrderStatus).toHaveBeenCalledWith("order-1", {
      status: "paid",
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
        order={makeOrder({ status: "pending" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    await user.click(screen.getByRole("button", { name: /mark as paid/i }))
    await user.click(screen.getByRole("button", { name: /confirm/i }))

    expect(mockErrorToast).toHaveBeenCalledWith("Transition not allowed")
  })

  it("closes dialog when cancel is clicked without calling action", async () => {
    const user = userEvent.setup()
    mockUpdateOrderStatus.mockClear()

    render(
      <OrderDetail
        order={makeOrder({ status: "pending" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    await user.click(screen.getByRole("button", { name: /mark as paid/i }))
    await user.click(screen.getByRole("button", { name: /cancel/i }))

    expect(mockUpdateOrderStatus).not.toHaveBeenCalled()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("disables button and shows loading while updating", async () => {
    const user = userEvent.setup()
    mockUpdateOrderStatus.mockReset()
    mockUpdateOrderStatus.mockReturnValue(new Promise(() => {}))

    render(
      <OrderDetail
        order={makeOrder({ status: "pending" })}
        listing={listing}
        currentUserId="buyer-1"
      />
    )
    await user.click(screen.getByRole("button", { name: /mark as paid/i }))

    const confirmBtn = screen.getByRole("button", { name: /confirm/i })
    await user.click(confirmBtn)

    expect(screen.getByRole("button", { name: /confirming/i })).toBeDisabled()
  })
})
