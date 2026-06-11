const API_BASE = process.env.API_BASE_URL || "http://localhost:8080"

export async function refreshTokens(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) return null

    const data = await res.json()
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    }
  } catch {
    return null
  }
}
