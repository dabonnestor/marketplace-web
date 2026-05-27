import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, waitFor } from "@testing-library/react"
import { AuthHydrator } from "@/components/auth-hydrator"
import { useAuthStore } from "@/stores/auth-store"

vi.mock("@/actions/auth", () => ({
  getCurrentUser: vi.fn(),
}))

import { getCurrentUser } from "@/actions/auth"

function resetStore() {
  useAuthStore.setState({ user: null, isLoading: true })
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
      expect(state.isLoading).toBe(false)
    })
  })

  it("sets user: null and isLoading: false when getCurrentUser returns null", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null)

    render(<AuthHydrator />)

    await waitFor(() => {
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isLoading).toBe(false)
    })
  })

  it("renders nothing", () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null)
    const { container } = render(<AuthHydrator />)
    expect(container.firstChild).toBeNull()
  })
})
