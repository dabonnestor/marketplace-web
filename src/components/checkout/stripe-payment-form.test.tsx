import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StripePaymentForm } from "@/components/checkout/stripe-payment-form"

const { mockConfirmPayment, mockErrorToast, mockPayOrder } = vi.hoisted(() => ({
  mockConfirmPayment: vi.fn(),
  mockErrorToast: vi.fn(),
  mockPayOrder: vi.fn(),
}))

vi.mock("@stripe/react-stripe-js", () => ({
  useStripe: () => ({ confirmPayment: mockConfirmPayment }),
  useElements: () => ({}),
  Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PaymentElement: () => <div data-testid="payment-element" />,
}))

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: () => ({}),
}))

vi.mock("@/actions/orders", () => ({
  payOrder: mockPayOrder,
}))

vi.mock("sonner", () => ({
  toast: { error: mockErrorToast },
}))

describe("StripePaymentForm", () => {
  it("renders the payment element and a pay button", () => {
    render(
      <StripePaymentForm
        clientSecret="cs_test_123"
        orderId="order-1"
        onSuccess={vi.fn()}
      />
    )

    expect(screen.getByTestId("payment-element")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /pay/i })).toBeInTheDocument()
  })

  it("shows loading text and disables the button while processing", async () => {
    const user = userEvent.setup()
    mockConfirmPayment.mockReturnValue(new Promise(() => {}))

    render(
      <StripePaymentForm
        clientSecret="cs_test_123"
        orderId="order-1"
        onSuccess={vi.fn()}
      />
    )

    await user.click(screen.getByRole("button", { name: /pay/i }))

    expect(
      screen.getByRole("button", { name: /processing payment/i })
    ).toBeDisabled()
  })

  it("calls confirmPayment then payOrder, and calls onSuccess on success", async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    mockConfirmPayment.mockReset()
    mockPayOrder.mockReset()

    mockConfirmPayment.mockResolvedValue({ error: null })
    mockPayOrder.mockResolvedValue({ success: true })

    render(
      <StripePaymentForm
        clientSecret="cs_test_123"
        orderId="order-1"
        onSuccess={onSuccess}
      />
    )

    await user.click(screen.getByRole("button", { name: /pay/i }))

    expect(mockConfirmPayment).toHaveBeenCalled()
    expect(mockPayOrder).toHaveBeenCalledWith("order-1")
    expect(onSuccess).toHaveBeenCalled()
  })

  it("shows error toast when payment is declined", async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    mockConfirmPayment.mockReset()
    mockErrorToast.mockReset()

    mockConfirmPayment.mockResolvedValue({
      error: { message: "Your card was declined." },
    })

    render(
      <StripePaymentForm
        clientSecret="cs_test_123"
        orderId="order-1"
        onSuccess={onSuccess}
      />
    )

    await user.click(screen.getByRole("button", { name: /pay/i }))

    expect(mockErrorToast).toHaveBeenCalledWith("Your card was declined.")
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it("shows error toast when payOrder fails after payment succeeds", async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    mockConfirmPayment.mockReset()
    mockPayOrder.mockReset()
    mockErrorToast.mockReset()

    mockConfirmPayment.mockResolvedValue({ error: null })
    mockPayOrder.mockResolvedValue({
      success: false,
      error: "Order already paid",
    })

    render(
      <StripePaymentForm
        clientSecret="cs_test_123"
        orderId="order-1"
        onSuccess={onSuccess}
      />
    )

    await user.click(screen.getByRole("button", { name: /pay/i }))

    expect(mockErrorToast).toHaveBeenCalledWith("Order already paid")
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
