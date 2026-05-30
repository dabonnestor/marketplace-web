import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import NotFound from "@/app/not-found"

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe("NotFound", () => {
  it("renders 404 message", () => {
    render(<NotFound />)

    expect(screen.getByText("404")).toBeInTheDocument()
    expect(screen.getByText(/page not found/i)).toBeInTheDocument()
  })

  it("has a link back to listings", () => {
    render(<NotFound />)

    const link = screen.getByRole("link", { name: /browse listings/i })
    expect(link).toHaveAttribute("href", "/listings")
  })
})
