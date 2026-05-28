import { describe, it, expect } from "vitest"
import { getValidTransitions, statusColor, statusLabel } from "./order-utils"
import type { OrderStatus } from "./api/types"

describe("getValidTransitions", () => {
  it("buyer of pending order can mark as paid only", () => {
    expect(getValidTransitions("pending", "buyer")).toEqual(["paid"])
  })

  it("seller of pending order has no actions", () => {
    expect(getValidTransitions("pending", "seller")).toEqual([])
  })

  it("seller of paid order can mark as shipped only", () => {
    expect(getValidTransitions("paid", "seller")).toEqual(["shipped"])
  })

  it("buyer of paid order has no actions", () => {
    expect(getValidTransitions("paid", "buyer")).toEqual([])
  })

  it("seller of shipped order can mark as delivered only", () => {
    expect(getValidTransitions("shipped", "seller")).toEqual(["delivered"])
  })

  it("buyer of shipped order has no actions", () => {
    expect(getValidTransitions("shipped", "buyer")).toEqual([])
  })

  it("buyer of delivered order can mark as completed only", () => {
    expect(getValidTransitions("delivered", "buyer")).toEqual(["completed"])
  })

  it("seller of delivered order has no actions", () => {
    expect(getValidTransitions("delivered", "seller")).toEqual([])
  })

  it("no actions for terminal status completed", () => {
    expect(getValidTransitions("completed", "buyer")).toEqual([])
    expect(getValidTransitions("completed", "seller")).toEqual([])
  })

  it("no actions for terminal status cancelled", () => {
    expect(getValidTransitions("cancelled", "buyer")).toEqual([])
    expect(getValidTransitions("cancelled", "seller")).toEqual([])
  })

  it("no actions for disputed", () => {
    expect(getValidTransitions("disputed", "buyer")).toEqual([])
    expect(getValidTransitions("disputed", "seller")).toEqual([])
  })

  it("no actions for non-participant (none role)", () => {
    const statuses: OrderStatus[] = ["pending", "paid", "shipped", "delivered", "completed", "disputed", "cancelled"]
    for (const s of statuses) {
      expect(getValidTransitions(s, "none")).toEqual([])
    }
  })
})

describe("statusColor", () => {
  it("returns gray for pending", () => {
    expect(statusColor("pending")).toBe("gray")
  })

  it("returns blue for paid", () => {
    expect(statusColor("paid")).toBe("blue")
  })

  it("returns orange for shipped", () => {
    expect(statusColor("shipped")).toBe("orange")
  })

  it("returns green for delivered", () => {
    expect(statusColor("delivered")).toBe("green")
  })

  it("returns green for completed", () => {
    expect(statusColor("completed")).toBe("green")
  })

  it("returns red for disputed", () => {
    expect(statusColor("disputed")).toBe("red")
  })

  it("returns red for cancelled", () => {
    expect(statusColor("cancelled")).toBe("red")
  })
})

describe("statusLabel", () => {
  it("capitalizes first letter of each status", () => {
    expect(statusLabel("pending")).toBe("Pending")
    expect(statusLabel("paid")).toBe("Paid")
    expect(statusLabel("shipped")).toBe("Shipped")
    expect(statusLabel("delivered")).toBe("Delivered")
    expect(statusLabel("completed")).toBe("Completed")
    expect(statusLabel("disputed")).toBe("Disputed")
    expect(statusLabel("cancelled")).toBe("Cancelled")
  })
})
