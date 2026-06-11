import { describe, it, expect, beforeEach } from "vitest"
import { useAuthStore } from "@/stores/auth-store"

function resetStore() {
  useAuthStore.setState({ user: null, ready: false })
}

describe("useAuthStore", () => {
  beforeEach(() => {
    resetStore()
  })

  it("initializes with user: null and ready: false", () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.ready).toBe(false)
    expect(state).not.toHaveProperty("isLoading")
    expect(state).not.toHaveProperty("setLoading")
  })

  it("setUser(user) sets user but does not change ready", () => {
    const user = { id: "1", email: "a@b.com", name: "Alice", createdAt: "2025-01-01" }
    useAuthStore.getState().setUser(user)
    expect(useAuthStore.getState().user).toEqual(user)
    expect(useAuthStore.getState().ready).toBe(false)
  })

  it("setUser(null) resets user but does not change ready", () => {
    const user = { id: "1", email: "a@b.com", name: "Alice", createdAt: "2025-01-01" }
    useAuthStore.getState().setUser(user)
    useAuthStore.getState().setUser(null)
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().ready).toBe(false)
  })

  it("hydrate(user) sets user and ready: true atomically", () => {
    const user = { id: "1", email: "a@b.com", name: "Alice", createdAt: "2025-01-01" }
    useAuthStore.getState().hydrate(user)
    expect(useAuthStore.getState().user).toEqual(user)
    expect(useAuthStore.getState().ready).toBe(true)
  })

  it("hydrate(null) sets user: null and ready: true atomically", () => {
    useAuthStore.getState().hydrate(null)
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().ready).toBe(true)
  })
})
