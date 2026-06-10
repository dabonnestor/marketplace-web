import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ListingDetail } from "@/components/listings/listing-detail"
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

const { mockPush, mockDeleteListing, mockSuccessToast, mockErrorToast } =
  vi.hoisted(() => ({
    mockPush: vi.fn(),
    mockDeleteListing: vi.fn(),
    mockSuccessToast: vi.fn(),
    mockErrorToast: vi.fn(),
  }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/actions/listings", async () => {
  const actual = await vi.importActual("@/actions/listings")
  return {
    ...actual,
    deleteListing: mockDeleteListing,
  }
})

vi.mock("sonner", () => ({
  toast: { success: mockSuccessToast, error: mockErrorToast },
}))

const listing: Listing = {
  id: "abc-123",
  sellerId: "seller-1",
  sellerName: "Test Seller",
  title: "Vintage Watch",
  description: "A beautiful vintage watch",
  price: "99.99",
  category: "Electronics",
  condition: "Like New",
  shippingCost: "5.00",
  images: ["https://example.com/watch.jpg"],
  status: "active",
  createdAt: "2025-01-01",
  updatedAt: "2025-01-02",
}

describe("ListingDetail", () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockDeleteListing.mockClear()
    mockSuccessToast.mockClear()
    mockErrorToast.mockClear()
  })

  it("renders title and formatted price", () => {
    renderWithClient(<ListingDetail listing={listing} currentUserId={null} />)

    expect(screen.getByRole("heading", { name: "Vintage Watch" })).toBeInTheDocument()
    expect(screen.getByText("$99.99")).toBeInTheDocument()
  })

  it("renders description, condition badge, category, seller name, and date", () => {
    renderWithClient(<ListingDetail listing={listing} currentUserId={null} />)

    expect(screen.getByText("A beautiful vintage watch")).toBeInTheDocument()
    expect(screen.getByText("Like New")).toBeInTheDocument()
    expect(screen.getByText("Electronics")).toBeInTheDocument()
    expect(screen.getByText("Test Seller")).toBeInTheDocument()
    expect(screen.getByText(/january 1, 2025/i)).toBeInTheDocument()
  })

  it("shows images when listing has them, placeholder when empty", () => {
    const { rerender } = renderWithClient(
      <ListingDetail listing={listing} currentUserId={null} />
    )

    const img = screen.getByRole("img")
    expect(img).toHaveAttribute("src", "https://example.com/watch.jpg")
    expect(img).toHaveAttribute("alt", listing.title)

    const noImages = { ...listing, images: [] }
    rerender(<ListingDetail listing={noImages} currentUserId={null} />)

    expect(screen.getByText(/no image/i)).toBeInTheDocument()
  })

  it("shows Buy Now button for authenticated non-seller", () => {
    renderWithClient(<ListingDetail listing={listing} currentUserId="buyer-99" />)

    expect(screen.getByRole("link", { name: /buy now/i })).toBeInTheDocument()
  })

  it("shows Edit button for the seller", () => {
    renderWithClient(<ListingDetail listing={listing} currentUserId="seller-1" />)

    expect(screen.getByRole("link", { name: /edit/i })).toBeInTheDocument()
  })

  it("shows Sign in link for unauthenticated users", () => {
    renderWithClient(<ListingDetail listing={listing} currentUserId={null} />)

    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument()
  })

  it("does not show Buy Now or Edit for unauthenticated users", () => {
    renderWithClient(<ListingDetail listing={listing} currentUserId={null} />)

    expect(screen.queryByRole("link", { name: /buy now/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /edit/i })).not.toBeInTheDocument()
  })

  describe("delete listing", () => {
    it("shows Delete button for the seller", () => {
      renderWithClient(<ListingDetail listing={listing} currentUserId="seller-1" />)

      expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument()
    })

    it("does not show Delete button for unauthenticated users", () => {
      renderWithClient(<ListingDetail listing={listing} currentUserId={null} />)

      expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument()
    })

    it("does not show Delete button for non-seller authenticated users", () => {
      renderWithClient(<ListingDetail listing={listing} currentUserId="buyer-99" />)

      expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument()
    })

    it("opens confirmation dialog when Delete is clicked", async () => {
      const user = userEvent.setup()
      renderWithClient(<ListingDetail listing={listing} currentUserId="seller-1" />)

      await user.click(screen.getByRole("button", { name: /delete/i }))

      expect(screen.getByRole("dialog")).toBeInTheDocument()
      expect(
        screen.getByText(/this action cannot be undone/i)
      ).toBeInTheDocument()
    })

    it("closes dialog when Cancel is clicked", async () => {
      const user = userEvent.setup()
      renderWithClient(<ListingDetail listing={listing} currentUserId="seller-1" />)

      await user.click(screen.getByRole("button", { name: /delete/i }))
      expect(screen.getByRole("dialog")).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: /cancel/i }))
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("calls deleteListing, shows success toast, and redirects on confirm", async () => {
      mockDeleteListing.mockResolvedValue({ success: true })

      const user = userEvent.setup()
      renderWithClient(<ListingDetail listing={listing} currentUserId="seller-1" />)

      await user.click(screen.getByRole("button", { name: /delete/i }))
      await user.click(
        screen.getByRole("button", { name: /confirm/i })
      )

      await waitFor(() => {
        expect(mockDeleteListing).toHaveBeenCalledWith("abc-123")
        expect(mockSuccessToast).toHaveBeenCalled()
        expect(mockPush).toHaveBeenCalledWith("/listings")
      })
    })

    it("shows error toast when delete fails", async () => {
      mockDeleteListing.mockResolvedValue({
        success: false,
        error: "Delete failed",
      })

      const user = userEvent.setup()
      renderWithClient(<ListingDetail listing={listing} currentUserId="seller-1" />)

      await user.click(screen.getByRole("button", { name: /delete/i }))
      await user.click(
        screen.getByRole("button", { name: /confirm/i })
      )

      await waitFor(() => {
        expect(mockErrorToast).toHaveBeenCalledWith("Delete failed")
      })
      expect(mockPush).not.toHaveBeenCalled()
    })

    it("shows loading state on confirm button during deletion", async () => {
      let resolvePromise: (v: unknown) => void
      const pending = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockDeleteListing.mockReturnValue(pending)

      const user = userEvent.setup()
      renderWithClient(<ListingDetail listing={listing} currentUserId="seller-1" />)

      await user.click(screen.getByRole("button", { name: /delete/i }))
      await user.click(
        screen.getByRole("button", { name: /confirm/i })
      )

      expect(
        screen.getByRole("button", { name: /deleting/i })
      ).toBeInTheDocument()

      resolvePromise!({ success: true })
    })
  })
})
