import { Button } from "@/components/ui/button"
import { statusLabel } from "@/lib/order-utils"
import type { OrderStatus } from "@/lib/api/types"

function actionLabel(status: OrderStatus): string {
  switch (status) {
    case "paid":
      return "Mark as Paid"
    case "shipped":
      return "Mark as Shipped"
    case "delivered":
      return "Mark as Delivered"
    case "completed":
      return "Mark as Completed"
    default:
      return `Mark as ${statusLabel(status)}`
  }
}

interface OrderActionsProps {
  validTransitions: OrderStatus[]
  canCancel: boolean
  canRefund: boolean
  onAction: (status: OrderStatus) => void
  onCancel: () => void
  onRefund: () => void
}

export function OrderActions({
  validTransitions,
  canCancel,
  canRefund,
  onAction,
  onCancel,
  onRefund,
}: OrderActionsProps) {
  return (
    <>
      {validTransitions.length > 0 && (
        <div className="space-y-2">
          {validTransitions.map((s) => (
            <Button
              key={s}
              onClick={() => onAction(s)}
              className="w-full"
            >
              {actionLabel(s)}
            </Button>
          ))}
        </div>
      )}

      {canCancel && (
        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full"
          >
            Cancel Order
          </Button>
        </div>
      )}

      {canRefund && (
        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={onRefund}
            className="w-full"
          >
            Request a Refund
          </Button>
        </div>
      )}
    </>
  )
}
