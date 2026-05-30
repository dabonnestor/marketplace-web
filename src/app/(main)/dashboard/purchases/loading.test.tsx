import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import DashboardPurchasesLoading from "@/app/(main)/dashboard/purchases/loading"

describe("DashboardPurchasesLoading", () => {
  it("renders skeleton placeholders", () => {
    render(<DashboardPurchasesLoading />)
    const skeletons = document.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
