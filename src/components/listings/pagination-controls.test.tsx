import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PaginationControls } from "@/components/listings/pagination-controls"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}))

describe("PaginationControls", () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it("shows current page and total pages", () => {
    render(<PaginationControls page={3} totalPages={10} />)

    expect(screen.getByText("Page 3 of 10")).toBeInTheDocument()
  })

  it("has previous and next buttons", () => {
    render(<PaginationControls page={2} totalPages={5} />)

    expect(screen.getByText("Previous")).toBeInTheDocument()
    expect(screen.getByText("Next")).toBeInTheDocument()
  })

  it("disables previous button on page 1", () => {
    render(<PaginationControls page={1} totalPages={5} />)

    expect(screen.getByText("Previous")).toBeDisabled()
    expect(screen.getByText("Next")).not.toBeDisabled()
  })

  it("disables next button on last page", () => {
    render(<PaginationControls page={5} totalPages={5} />)

    expect(screen.getByText("Next")).toBeDisabled()
    expect(screen.getByText("Previous")).not.toBeDisabled()
  })

  it("navigates to previous page via URL on click", async () => {
    const user = userEvent.setup()
    render(<PaginationControls page={3} totalPages={10} />)

    await user.click(screen.getByText("Previous"))

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=2"))
  })

  it("navigates to next page via URL on click", async () => {
    const user = userEvent.setup()
    render(<PaginationControls page={3} totalPages={10} />)

    await user.click(screen.getByText("Next"))

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=4"))
  })
})
