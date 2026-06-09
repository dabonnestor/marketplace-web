import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const API_BASE = process.env.API_BASE_URL || "http://localhost:8080"

function isJwtExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    // exp is in seconds; consider expired if within 30s of expiry
    return payload.exp * 1000 < Date.now() + 30_000
  } catch {
    // If we can't decode it, treat as expired to be safe
    return true
  }
}

async function tryRefresh(
  request: NextRequest,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const refreshToken = request.cookies.get("refreshToken")?.value
  if (!refreshToken) return null

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

function setCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  response.cookies.set("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  })
  response.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  })
}

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value
  const pathname = request.nextUrl.pathname
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register")

  // Valid token — for auth routes redirect to home, otherwise proceed
  if (accessToken && !isJwtExpired(accessToken)) {
    if (isAuthRoute) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  // Token missing or expired — try to refresh
  const tokens = await tryRefresh(request)

  if (tokens) {
    if (isAuthRoute) {
      const response = NextResponse.redirect(new URL("/", request.url))
      setCookies(response, tokens.accessToken, tokens.refreshToken)
      return response
    }
    const response = NextResponse.next()
    setCookies(response, tokens.accessToken, tokens.refreshToken)
    return response
  }

  // No valid session
  if (isAuthRoute) {
    return NextResponse.next()
  }
  return NextResponse.redirect(new URL("/login", request.url))
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/dashboard/:path*",
    "/orders/:path*",
    "/listings/new",
    "/listings/:path*/edit",
    "/listings/:path*/confirm",
  ],
}
