import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ErrorBoundary } from "@/components/error-boundary"

describe("ErrorBoundary", () => {
  it("renders error message", () => {
    render(
      <ErrorBoundary
        error={new Error("Failed to fetch data")}
        unstable_retry={vi.fn()}
      />
    )

    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    expect(screen.getByText("Failed to fetch data")).toBeInTheDocument()
  })

  it("calls unstable_retry when Try again is clicked", async () => {
    const mockRetry = vi.fn()
    const user = userEvent.setup()

    render(
      <ErrorBoundary
        error={new Error("Boom")}
        unstable_retry={mockRetry}
      />
    )

    await user.click(screen.getByRole("button", { name: /try again/i }))
    expect(mockRetry).toHaveBeenCalledOnce()
  })

  it("shows fallback message when error has no message", () => {
    render(
      <ErrorBoundary
        error={new Error()}
        unstable_retry={vi.fn()}
      />
    )

    expect(screen.getByText("An unexpected error occurred")).toBeInTheDocument()
  })
})
