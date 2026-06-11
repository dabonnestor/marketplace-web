"use client"

import { useEffect } from "react"
import { getCurrentUser } from "@/lib/api/actions"
import { useAuthStore } from "@/stores/auth-store"

export function AuthHydrator() {
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    getCurrentUser().then(hydrate)
  }, [hydrate])

  return null
}
