import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { PriceRow } from "@/components/ui/price-row"

describe("PriceRow", () => {
  it("renders label and amount", () => {
    render(<PriceRow label="Subtotal" amount="$12.50" />)
    expect(screen.getByText("Subtotal")).toBeInTheDocument()
    expect(screen.getByText("$12.50")).toBeInTheDocument()
  })

  it("applies bold styling to both label and amount when bold is true", () => {
    render(<PriceRow label="Total" amount="$99.00" bold />)
    const label = screen.getByText("Total")
    const amount = screen.getByText("$99.00")
    expect(label.className).toContain("font-semibold")
    expect(amount.className).toContain("font-semibold")
  })

  it("does not apply bold styling when bold is false", () => {
    render(<PriceRow label="Shipping" amount="$5.00" />)
    const label = screen.getByText("Shipping")
    const amount = screen.getByText("$5.00")
    expect(label.className).not.toContain("font-semibold")
    expect(amount.className).not.toContain("font-semibold")
  })

  it("applies muted foreground class to label when not bold", () => {
    render(<PriceRow label="Shipping" amount="$5.00" />)
    const label = screen.getByText("Shipping")
    expect(label.className).toContain("text-muted-foreground")
  })
})
