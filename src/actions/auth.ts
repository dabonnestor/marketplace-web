"use server"

import { login as apiLogin, register as apiRegister, getMe, logout as apiLogout } from "@/lib/api/client"
import { wrapAction } from "@/lib/wrap-action"

export async function login(email: string, password: string) {
  return wrapAction(
    async () => {
      const user = await apiLogin(email, password)
      return { success: true as const, user }
    },
    "Login failed"
  )
}

export async function register(email: string, password: string, name: string) {
  return wrapAction(
    async () => {
      const user = await apiRegister(email, password, name)
      return { success: true as const, user }
    },
    "Registration failed"
  )
}

export async function getCurrentUser() {
  try {
    return await getMe()
  } catch {
    return null
  }
}

export async function logout() {
  await apiLogout()
}
