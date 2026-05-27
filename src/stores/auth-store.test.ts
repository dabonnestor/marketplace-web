import { describe, it, expect, beforeEach } from "vitest"
import { useAuthStore } from "@/stores/auth-store"

function resetStore() {
  useAuthStore.setState({ user: null, isLoading: true })
}

describe("useAuthStore", () => {
  beforeEach(() => {
    resetStore()
  })

  it("initializes with user: null and isLoading: true", () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isLoading).toBe(true)
  })

  it("setUser(user) sets user and isLoading: false", () => {
    const user = { id: "1", email: "a@b.com", name: "Alice", createdAt: "2025-01-01" }
    useAuthStore.getState().setUser(user)
    const state = useAuthStore.getState()
    expect(state.user).toEqual(user)
    expect(state.isLoading).toBe(false)
  })

  it("setUser(null) resets to user: null and isLoading: false", () => {
    const user = { id: "1", email: "a@b.com", name: "Alice", createdAt: "2025-01-01" }
    useAuthStore.getState().setUser(user)
    useAuthStore.getState().setUser(null)
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isLoading).toBe(false)
  })
})
