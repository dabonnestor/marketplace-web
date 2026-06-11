import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, waitFor } from "@testing-library/react"
import { AuthHydrator } from "@/components/auth-hydrator"
import { useAuthStore } from "@/stores/auth-store"

vi.mock("@/lib/api/actions", () => ({
  getCurrentUser: vi.fn(),
}))

import { getCurrentUser } from "@/lib/api/actions"

function resetStore() {
  useAuthStore.setState({ user: null, ready: false })
}

describe("AuthHydrator", () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  it("calls getCurrentUser on mount and hydrates store with user", async () => {
    const user = {
      id: "1",
      email: "a@b.com",
      name: "Alice",
      createdAt: "2025-01-01",
    }
    vi.mocked(getCurrentUser).mockResolvedValueOnce(user)

    render(<AuthHydrator />)

    await waitFor(() => {
      const state = useAuthStore.getState()
      expect(state.user).toEqual(user)
      expect(state.ready).toBe(true)
    })
  })

  it("sets user: null and ready: true when getCurrentUser returns null", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null)

    render(<AuthHydrator />)

    await waitFor(() => {
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.ready).toBe(true)
    })
  })

  it("renders nothing", () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null)
    const { container } = render(<AuthHydrator />)
    expect(container.firstChild).toBeNull()
  })
})
