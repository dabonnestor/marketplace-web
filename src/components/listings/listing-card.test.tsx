import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ListingCard } from "@/components/listings/listing-card"
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

describe("ListingCard", () => {
  it("renders title, price, condition badge, category, and links to listing detail", () => {
    render(<ListingCard listing={listing} />)

    expect(screen.getByText("Vintage Watch")).toBeInTheDocument()

    expect(screen.getByText("$99.99")).toBeInTheDocument()

    expect(screen.getByText("Like New")).toBeInTheDocument()
    expect(screen.getByText("Electronics")).toBeInTheDocument()

    const links = screen.getAllByRole("link")
    expect(links[0]).toHaveAttribute("href", "/listings/abc-123")
  })

  it("shows placeholder text when listing has no images", () => {
    const noImage = { ...listing, images: [] }
    render(<ListingCard listing={noImage} />)

    expect(screen.getByText("No image")).toBeInTheDocument()
  })
})
