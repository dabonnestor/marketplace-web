"use client"

import { useEffect } from "react"
import { getCurrentUser } from "@/actions/auth"
import { useAuthStore } from "@/stores/auth-store"

export function AuthHydrator() {
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [setUser])

  return null
}
