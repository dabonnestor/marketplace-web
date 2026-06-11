import { describe, it, expect, vi, beforeEach } from "vitest"
import { refreshTokens } from "./refresh-tokens"

const API_BASE = "http://localhost:8080"

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("refreshTokens", () => {
  it("returns new tokens on successful refresh", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ accessToken: "new-at", refreshToken: "new-rt" })
    )

    const result = await refreshTokens("valid-refresh-token")

    expect(result).toEqual({ accessToken: "new-at", refreshToken: "new-rt" })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_BASE}/api/v1/auth/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: "valid-refresh-token" }),
      }
    )
  })

  it("returns null when API returns non-OK status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "INVALID_TOKEN", message: "refresh expired" } }), { status: 401 })
    )

    const result = await refreshTokens("expired-refresh")

    expect(result).toBeNull()
  })

  it("returns null on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"))

    const result = await refreshTokens("any-token")

    expect(result).toBeNull()
  })
})
