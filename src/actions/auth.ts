"use server"

import { login as apiLogin, register as apiRegister, getMe, logout as apiLogout } from "@/lib/api/client"

export async function login(email: string, password: string) {
  try {
    const user = await apiLogin(email, password)
    return { success: true, user }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
    }
  }
}

export async function register(email: string, password: string, name: string) {
  try {
    const user = await apiRegister(email, password, name)
    return { success: true, user }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    }
  }
}

export async function getCurrentUser() {
  try {
    const user = await getMe()
    return user
  } catch {
    return null
  }
}

export async function logout() {
  await apiLogout()
}
