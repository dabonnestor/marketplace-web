import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const { mockPush, mockSearchParams } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSearchParams: { value: new URLSearchParams() },
}))

vi.mock("@/actions/seller", () => ({
  getOnboardStatus: vi.fn(),
  onboardSeller: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams.value,
}))

import { getOnboardStatus, onboardSeller } from "@/actions/seller"
import SellerOnboardPage from "./page"

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe("SellerOnboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams.value = new URLSearchParams()
  })

  it("shows success state with checkmark and dashboard link when onboarded", async () => {
    vi.mocked(getOnboardStatus).mockResolvedValueOnce({
      success: true,
      onboarded: true,
      chargesEnabled: true,
      payoutsEnabled: true,
    } as any)

    render(<SellerOnboardPage />, { wrapper })

    expect(await screen.findByText(/you're ready to sell/i)).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /go to dashboard/i })
    ).toBeInTheDocument()
  })

  it("shows error state with message and retry button when URL has error param", async () => {
    mockSearchParams.value = new URLSearchParams("error=onboarding%20failed")
    vi.mocked(getOnboardStatus).mockResolvedValueOnce({
      success: true,
      onboarded: false,
      chargesEnabled: false,
      payoutsEnabled: false,
    } as any)

    render(<SellerOnboardPage />, { wrapper })

    expect(
      await screen.findByRole("heading", { name: /onboarding failed/i })
    ).toBeInTheDocument()
    expect(screen.getByText("onboarding failed")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument()
  })

  it("retry button calls onboardSeller and redirects to the returned URL", async () => {
    vi.mocked(getOnboardStatus).mockResolvedValueOnce({
      success: true,
      onboarded: false,
      chargesEnabled: false,
      payoutsEnabled: false,
    } as any)

    vi.mocked(onboardSeller).mockResolvedValueOnce({
      success: true,
      url: "https://connect.stripe.com/setup/s/yyy",
    } as any)

    const originalLocation = window.location
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    })

    render(<SellerOnboardPage />, { wrapper })

    const user = userEvent.setup()
    const button = await screen.findByRole("button", { name: /try again/i })
    await user.click(button)

    await vi.waitFor(() => {
      expect(onboardSeller).toHaveBeenCalled()
    })

    expect(window.location.href).toBe(
      "https://connect.stripe.com/setup/s/yyy"
    )

    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    })
  })

  it("shows loading skeleton while checking onboarding status", () => {
    vi.mocked(getOnboardStatus).mockReturnValueOnce(new Promise(() => {}))

    render(<SellerOnboardPage />, { wrapper })

    expect(screen.getByRole("status")).toBeInTheDocument()
  })
})
