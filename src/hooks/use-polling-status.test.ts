import { describe, it, expect } from "vitest"
import { usePollingStatus } from "./use-polling-status"

function query(data: { status: string } | undefined | null) {
  return { state: { data } }
}

describe("usePollingStatus", () => {
  it("returns interval when query data is null (poll while loading)", () => {
    const refetchInterval = usePollingStatus()
    expect(refetchInterval(query(null))).toBe(30000)
  })

  it("returns interval when query data is undefined (poll while loading)", () => {
    const refetchInterval = usePollingStatus()
    expect(refetchInterval(query(undefined))).toBe(30000)
  })

  it("returns false for terminal statuses", () => {
    const refetchInterval = usePollingStatus()
    expect(refetchInterval(query({ status: "completed" }))).toBe(false)
    expect(refetchInterval(query({ status: "cancelled" }))).toBe(false)
    expect(refetchInterval(query({ status: "expired" }))).toBe(false)
    expect(refetchInterval(query({ status: "refunded" }))).toBe(false)
  })

  it("returns interval for in-flight statuses", () => {
    const refetchInterval = usePollingStatus()
    expect(refetchInterval(query({ status: "pending" }))).toBe(30000)
    expect(refetchInterval(query({ status: "paid" }))).toBe(30000)
    expect(refetchInterval(query({ status: "shipped" }))).toBe(30000)
    expect(refetchInterval(query({ status: "delivered" }))).toBe(30000)
    expect(refetchInterval(query({ status: "disputed" }))).toBe(30000)
  })

  it("respects a custom interval", () => {
    const refetchInterval = usePollingStatus(10000)
    expect(refetchInterval(query({ status: "pending" }))).toBe(10000)
    expect(refetchInterval(query({ status: "completed" }))).toBe(false)
  })
})
