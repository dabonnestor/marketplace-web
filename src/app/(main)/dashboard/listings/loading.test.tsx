import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import DashboardListingsLoading from "@/app/(main)/dashboard/listings/loading"

describe("DashboardListingsLoading", () => {
  it("renders skeleton placeholders", () => {
    render(<DashboardListingsLoading />)
    const skeletons = document.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
