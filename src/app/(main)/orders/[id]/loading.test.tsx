import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import OrderDetailLoading from "@/app/(main)/orders/[id]/loading"

describe("OrderDetailLoading", () => {
  it("renders skeleton placeholders", () => {
    render(<OrderDetailLoading />)
    const skeletons = document.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
