import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ListingDetail } from "@/components/listings/listing-detail"
import type { Listing } from "@/lib/api/types"

const listing: Listing = {
  id: "abc-123",
  sellerId: "seller-1",
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
  it("renders title and formatted price", () => {
    render(<ListingDetail listing={listing} currentUserId={null} />)

    expect(screen.getByRole("heading", { name: "Vintage Watch" })).toBeInTheDocument()
    expect(screen.getByText("$99.99")).toBeInTheDocument()
  })

  it("renders description, condition badge, category, shipping cost, seller name, and date", () => {
    render(<ListingDetail listing={listing} currentUserId={null} />)

    expect(screen.getByText("A beautiful vintage watch")).toBeInTheDocument()
    expect(screen.getByText("Like New")).toBeInTheDocument()
    expect(screen.getByText("Electronics")).toBeInTheDocument()
    expect(screen.getByText("$5.00")).toBeInTheDocument()
    expect(screen.getByText("seller-1")).toBeInTheDocument()
    expect(screen.getByText(/january 1, 2025/i)).toBeInTheDocument()
  })

  it("shows images when listing has them, placeholder when empty", () => {
    const { rerender } = render(
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
    render(<ListingDetail listing={listing} currentUserId="buyer-99" />)

    expect(screen.getByRole("link", { name: /buy now/i })).toBeInTheDocument()
  })

  it("shows Edit button for the seller", () => {
    render(<ListingDetail listing={listing} currentUserId="seller-1" />)

    expect(screen.getByRole("link", { name: /edit/i })).toBeInTheDocument()
  })

  it("shows Sign in link for unauthenticated users", () => {
    render(<ListingDetail listing={listing} currentUserId={null} />)

    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument()
  })

  it("does not show Buy Now or Edit for unauthenticated users", () => {
    render(<ListingDetail listing={listing} currentUserId={null} />)

    expect(screen.queryByRole("link", { name: /buy now/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /edit/i })).not.toBeInTheDocument()
  })
})
