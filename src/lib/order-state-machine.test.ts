import { describe, it, expect } from "vitest"
import {
  getValidTransitions,
  canCancel,
  canRefund,
  canCompletePayment,
  statusColor,
  statusLabel,
  actionLabel,
  progressSteps,
  isTerminal,
  shouldPoll,
  allStatuses,
  badgeClasses,
} from "./order-state-machine"
import type { OrderStatus } from "./api/types"

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------
describe("getValidTransitions", () => {
  it("buyer of pending order has no actions", () => {
    expect(getValidTransitions("pending", "buyer")).toEqual([])
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

  it("no actions for terminal statuses", () => {
    const terminals: OrderStatus[] = ["completed", "cancelled", "expired", "refunded", "disputed"]
    for (const s of terminals) {
      expect(getValidTransitions(s, "buyer")).toEqual([])
      expect(getValidTransitions(s, "seller")).toEqual([])
    }
  })

  it("no actions for non-participant (none role)", () => {
    const statuses: OrderStatus[] = [
      "pending", "paid", "shipped", "delivered",
      "completed", "disputed", "cancelled", "expired", "refunded",
    ]
    for (const s of statuses) {
      expect(getValidTransitions(s, "none")).toEqual([])
    }
  })
})

// ---------------------------------------------------------------------------
// Eligibility checks
// ---------------------------------------------------------------------------
describe("canCancel", () => {
  it("buyer can cancel pending order", () => {
    expect(canCancel("pending", "buyer")).toBe(true)
  })

  it("buyer cannot cancel paid order", () => {
    expect(canCancel("paid", "buyer")).toBe(false)
  })

  it("buyer cannot cancel shipped order", () => {
    expect(canCancel("shipped", "buyer")).toBe(false)
  })

  it("seller cannot cancel any order", () => {
    const statuses: OrderStatus[] = [
      "pending", "paid", "shipped", "delivered",
    ]
    for (const s of statuses) {
      expect(canCancel(s, "seller")).toBe(false)
    }
  })

  it("terminal statuses cannot be cancelled", () => {
    expect(canCancel("completed", "buyer")).toBe(false)
    expect(canCancel("cancelled", "buyer")).toBe(false)
  })
})

describe("canRefund", () => {
  it("buyer can refund paid order", () => {
    expect(canRefund("paid", "buyer")).toBe(true)
  })

  it("buyer can refund shipped order", () => {
    expect(canRefund("shipped", "buyer")).toBe(true)
  })

  it("buyer can refund delivered order", () => {
    expect(canRefund("delivered", "buyer")).toBe(true)
  })

  it("buyer cannot refund pending order", () => {
    expect(canRefund("pending", "buyer")).toBe(false)
  })

  it("buyer cannot refund completed order", () => {
    expect(canRefund("completed", "buyer")).toBe(false)
  })

  it("seller cannot refund any order", () => {
    const statuses: OrderStatus[] = ["paid", "shipped", "delivered"]
    for (const s of statuses) {
      expect(canRefund(s, "seller")).toBe(false)
    }
  })
})

describe("canCompletePayment", () => {
  it("buyer can complete payment when pending with clientSecret", () => {
    expect(canCompletePayment("pending", "buyer", true)).toBe(true)
  })

  it("buyer cannot complete payment when pending without clientSecret", () => {
    expect(canCompletePayment("pending", "buyer", false)).toBe(false)
  })

  it("buyer cannot complete payment for non-pending order", () => {
    expect(canCompletePayment("paid", "buyer", true)).toBe(false)
  })

  it("seller cannot complete payment", () => {
    expect(canCompletePayment("pending", "seller", true)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------
describe("statusColor", () => {
  it("returns correct color for each status", () => {
    expect(statusColor("pending")).toBe("gray")
    expect(statusColor("paid")).toBe("blue")
    expect(statusColor("shipped")).toBe("orange")
    expect(statusColor("delivered")).toBe("green")
    expect(statusColor("completed")).toBe("green")
    expect(statusColor("disputed")).toBe("red")
    expect(statusColor("cancelled")).toBe("red")
    expect(statusColor("expired")).toBe("red")
    expect(statusColor("refunded")).toBe("red")
  })
})

describe("badgeClasses", () => {
  it("maps the same color keys as statusColor", () => {
    const statuses: OrderStatus[] = [
      "pending", "paid", "shipped", "delivered",
      "completed", "disputed", "cancelled", "expired", "refunded",
    ]
    for (const s of statuses) {
      const color = statusColor(s)
      expect(badgeClasses).toHaveProperty(color)
    }
  })

  it("each entry is a non-empty CSS class string", () => {
    for (const cls of Object.values(badgeClasses)) {
      expect(cls).toBeTruthy()
      expect(typeof cls).toBe("string")
    }
  })
})

describe("statusLabel", () => {
  it("capitalizes first letter", () => {
    expect(statusLabel("pending")).toBe("Pending")
    expect(statusLabel("paid")).toBe("Paid")
    expect(statusLabel("shipped")).toBe("Shipped")
    expect(statusLabel("delivered")).toBe("Delivered")
    expect(statusLabel("completed")).toBe("Completed")
    expect(statusLabel("disputed")).toBe("Disputed")
    expect(statusLabel("cancelled")).toBe("Cancelled")
    expect(statusLabel("expired")).toBe("Expired")
    expect(statusLabel("refunded")).toBe("Refunded")
  })
})

describe("actionLabel", () => {
  it("returns human-friendly label for each transition target", () => {
    expect(actionLabel("paid")).toBe("Mark as Paid")
    expect(actionLabel("shipped")).toBe("Mark as Shipped")
    expect(actionLabel("delivered")).toBe("Mark as Delivered")
    expect(actionLabel("completed")).toBe("Mark as Completed")
  })

  it("falls back to status label for unknown statuses", () => {
    expect(actionLabel("pending")).toBe("Mark as Pending")
    expect(actionLabel("disputed")).toBe("Mark as Disputed")
  })
})

// ---------------------------------------------------------------------------
// Progress steps
// ---------------------------------------------------------------------------
describe("progressSteps", () => {
  it("contains the happy-path order lifecycle", () => {
    expect(progressSteps).toEqual([
      "pending",
      "paid",
      "shipped",
      "delivered",
      "completed",
    ])
  })

  it("is readonly", () => {
    expect(() => {
      (progressSteps as OrderStatus[]).push("disputed")
    }).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Terminal / polling
// ---------------------------------------------------------------------------
describe("isTerminal", () => {
  it("terminal statuses return true", () => {
    expect(isTerminal("completed")).toBe(true)
    expect(isTerminal("cancelled")).toBe(true)
    expect(isTerminal("expired")).toBe(true)
    expect(isTerminal("refunded")).toBe(true)
  })

  it("non-terminal statuses return false", () => {
    expect(isTerminal("pending")).toBe(false)
    expect(isTerminal("paid")).toBe(false)
    expect(isTerminal("shipped")).toBe(false)
    expect(isTerminal("delivered")).toBe(false)
    expect(isTerminal("disputed")).toBe(false)
  })
})

describe("shouldPoll", () => {
  it("should not poll terminal statuses", () => {
    expect(shouldPoll("completed")).toBe(false)
    expect(shouldPoll("cancelled")).toBe(false)
    expect(shouldPoll("expired")).toBe(false)
    expect(shouldPoll("refunded")).toBe(false)
  })

  it("should poll in-flight statuses", () => {
    expect(shouldPoll("pending")).toBe(true)
    expect(shouldPoll("paid")).toBe(true)
    expect(shouldPoll("shipped")).toBe(true)
    expect(shouldPoll("delivered")).toBe(true)
    expect(shouldPoll("disputed")).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// All statuses
// ---------------------------------------------------------------------------
describe("allStatuses", () => {
  it("contains all 9 statuses in order", () => {
    expect(allStatuses).toEqual([
      "pending",
      "paid",
      "shipped",
      "delivered",
      "completed",
      "disputed",
      "cancelled",
      "expired",
      "refunded",
    ])
  })

  it("is readonly", () => {
    expect(() => {
      (allStatuses as OrderStatus[]).push("pending")
    }).toThrow()
  })
})
