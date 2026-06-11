import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

vi.mock("@/lib/api/actions", () => ({
  getOnboardStatus: vi.fn(),
  onboardSeller: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}))

import { getOnboardStatus, onboardSeller } from "@/lib/api/actions"
import { OnboardingBanner } from "@/components/listings/onboarding-banner"

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe("OnboardingBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders banner with set up payouts button when seller is not onboarded", async () => {
    vi.mocked(getOnboardStatus).mockResolvedValueOnce({
      success: true,
      onboarded: false,
      chargesEnabled: false,
      payoutsEnabled: false,
    } as any)

    render(<OnboardingBanner />, { wrapper })

    const button = await screen.findByRole("button", { name: /set up payouts/i })
    expect(button).toBeInTheDocument()
    expect(screen.getByText(/connect your stripe account/i)).toBeInTheDocument()
  })

  it("hides banner when seller is fully onboarded", async () => {
    vi.mocked(getOnboardStatus).mockResolvedValueOnce({
      success: true,
      onboarded: true,
      chargesEnabled: true,
      payoutsEnabled: true,
    } as any)

    render(<OnboardingBanner />, { wrapper })

    await vi.waitFor(() => {
      expect(getOnboardStatus).toHaveBeenCalled()
    })

    expect(
      screen.queryByRole("button", { name: /set up payouts/i })
    ).not.toBeInTheDocument()
  })

  it("shows loading skeleton while checking onboarding status", () => {
    vi.mocked(getOnboardStatus).mockReturnValueOnce(new Promise(() => {}))

    render(<OnboardingBanner />, { wrapper })

    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("calls onboardSeller and redirects to the returned Stripe URL on button click", async () => {
    vi.mocked(getOnboardStatus).mockResolvedValueOnce({
      success: true,
      onboarded: false,
      chargesEnabled: false,
      payoutsEnabled: false,
    } as any)

    vi.mocked(onboardSeller).mockResolvedValueOnce({
      success: true,
      url: "https://connect.stripe.com/setup/s/xxx",
    } as any)

    // Capture href assignment
    const originalLocation = window.location
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    })

    render(<OnboardingBanner />, { wrapper })

    const user = userEvent.setup()
    const button = await screen.findByRole("button", { name: /set up payouts/i })
    await user.click(button)

    await vi.waitFor(() => {
      expect(onboardSeller).toHaveBeenCalled()
    })

    expect(window.location.href).toBe(
      "https://connect.stripe.com/setup/s/xxx"
    )

    // Restore
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    })
  })
})
