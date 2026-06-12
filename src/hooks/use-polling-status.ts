import { shouldPoll } from "@/lib/order-state-machine"
import type { OrderStatus } from "@/lib/api/types"

export function usePollingStatus(interval = 30000) {
  return (query: { state: { data?: { status: OrderStatus } | null } }) => {
    const data = query.state.data
    if (!data) return interval
    return shouldPoll(data.status) ? interval : false
  }
}
