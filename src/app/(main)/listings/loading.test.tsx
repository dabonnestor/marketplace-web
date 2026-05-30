import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import ListingsLoading from "@/app/(main)/listings/loading"

describe("ListingsLoading", () => {
  it("renders skeleton placeholders", () => {
    render(<ListingsLoading />)

    const skeletons = document.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
