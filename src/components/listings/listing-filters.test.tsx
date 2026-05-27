import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ListingFilters } from "@/components/listings/listing-filters"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}))

const categories = ["Electronics", "Clothing", "Home", "Sports"]

describe("ListingFilters", () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it("renders search input, category dropdown trigger, and price min/max inputs", () => {
    render(<ListingFilters categories={categories} />)

    expect(
      screen.getByPlaceholderText("Search listings...")
    ).toBeInTheDocument()
    expect(screen.getByText("All categories")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Min")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Max")).toBeInTheDocument()
  })

  it("calls router.push with ?search= param when typing in search input", async () => {
    const user = userEvent.setup()
    render(<ListingFilters categories={categories} />)

    const input = screen.getByPlaceholderText("Search listings...")
    await user.type(input, "watch")

    // Wait for debounce
    await vi.waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith("/listings?search=watch&page=1")
      },
      { timeout: 500 }
    )
  })

  it("reads initial values from URL search params", async () => {
    const user = userEvent.setup()
    render(<ListingFilters categories={categories} />)

    // Price inputs trigger URL update on blur
    const minInput = screen.getByPlaceholderText("Min")
    await user.type(minInput, "10")
    await user.tab()

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("minPrice=10")
    )
  })
})
