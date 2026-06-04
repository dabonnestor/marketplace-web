"use server"

import {
  onboardSeller as apiOnboardSeller,
  getOnboardStatus as apiGetOnboardStatus,
} from "@/lib/api/client"
import { wrapAction } from "@/lib/wrap-action"

export async function onboardSeller() {
  return wrapAction(
    async () => {
      const result = await apiOnboardSeller()
      return { success: true as const, url: result.url }
    },
    "Failed to start seller onboarding"
  )
}

export async function getOnboardStatus() {
  return wrapAction(
    async () => {
      const result = await apiGetOnboardStatus()
      return { success: true as const, ...result }
    },
    "Failed to check onboarding status"
  )
}
