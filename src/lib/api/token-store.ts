export interface TokenStore {
  getAccessToken(): Promise<string | null>
  getRefreshToken(): Promise<string | null>
  setTokens(accessToken: string, refreshToken: string): Promise<void>
  clearTokens(): Promise<void>
}

export class CookieTokenStore implements TokenStore {
  async getAccessToken(): Promise<string | null> {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    return cookieStore.get("accessToken")?.value ?? null
  }

  async getRefreshToken(): Promise<string | null> {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    return cookieStore.get("refreshToken")?.value ?? null
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    cookieStore.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    })
    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    })
  }

  async clearTokens(): Promise<void> {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    cookieStore.delete("accessToken")
    cookieStore.delete("refreshToken")
  }
}

export class MemoryTokenStore implements TokenStore {
  private accessToken: string | null = null
  private refreshToken: string | null = null

  async getAccessToken(): Promise<string | null> {
    return this.accessToken
  }

  async getRefreshToken(): Promise<string | null> {
    return this.refreshToken
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
  }

  async clearTokens(): Promise<void> {
    this.accessToken = null
    this.refreshToken = null
  }
}
