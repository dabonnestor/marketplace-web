import { Fragment } from "react"
import { cn } from "@/lib/utils"
import { statusLabel } from "@/lib/order-utils"
import type { OrderStatus } from "@/lib/api/types"

const STATUS_STEPS: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "completed",
]

export function StatusProgress({ status }: { status: OrderStatus }) {
  const currentIdx = STATUS_STEPS.indexOf(status)
  const isTerminal = currentIdx === -1

  return (
    <div className="flex items-center gap-1">
      {STATUS_STEPS.map((step, i) => {
        const isReached = !isTerminal && i <= currentIdx
        const isCurrent = i === currentIdx
        const isFuture = !isReached

        return (
          <Fragment key={step}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  isReached && "bg-green-500 text-white",
                  isFuture && "bg-muted text-muted-foreground",
                )}
              >
                {isReached ? "✓" : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  isReached && "text-green-600 font-semibold",
                  isFuture && "text-muted-foreground",
                )}
              >
                {statusLabel(step)}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 mt-[-1.25rem]",
                  !isTerminal && i < currentIdx ? "bg-green-500" : "bg-border",
                )}
              />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
