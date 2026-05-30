import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import DashboardSalesLoading from "@/app/(main)/dashboard/sales/loading"

describe("DashboardSalesLoading", () => {
  it("renders skeleton placeholders", () => {
    render(<DashboardSalesLoading />)
    const skeletons = document.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
