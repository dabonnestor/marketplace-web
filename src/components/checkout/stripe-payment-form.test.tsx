import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StripePaymentForm } from "@/components/checkout/stripe-payment-form"

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

const { mockConfirmPayment, mockErrorToast, mockSuccessToast, mockPayOrder } = vi.hoisted(() => ({
  mockConfirmPayment: vi.fn(),
  mockErrorToast: vi.fn(),
  mockSuccessToast: vi.fn(),
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
  toast: { error: mockErrorToast, success: mockSuccessToast },
}))

describe("StripePaymentForm", () => {
  it("renders the payment element and a pay button", () => {
    renderWithClient(
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

    renderWithClient(
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

  it("calls confirmPayment then payOrder, shows success toast, and calls onSuccess on success", async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    mockConfirmPayment.mockReset()
    mockPayOrder.mockReset()
    mockSuccessToast.mockReset()

    mockConfirmPayment.mockResolvedValue({ error: null })
    mockPayOrder.mockResolvedValue({ success: true })

    renderWithClient(
      <StripePaymentForm
        clientSecret="cs_test_123"
        orderId="order-1"
        onSuccess={onSuccess}
      />
    )

    await user.click(screen.getByRole("button", { name: /pay/i }))

    expect(mockConfirmPayment).toHaveBeenCalled()
    expect(mockPayOrder).toHaveBeenCalledWith("order-1")
    expect(mockSuccessToast).toHaveBeenCalledWith("Payment successful!")
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

    renderWithClient(
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

    renderWithClient(
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
