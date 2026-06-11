import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { OrderStatus } from "@/lib/api/types"

interface StatusTransitionDialogProps {
  open: boolean
  targetStatus: OrderStatus | null
  onOpenChange: (open: boolean) => void
  onConfirm: (status: OrderStatus) => void
  isPending: boolean
}

export function StatusTransitionDialog({
  open,
  targetStatus,
  onOpenChange,
  onConfirm,
  isPending,
}: StatusTransitionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            Are you sure you want to mark this order as{" "}
            {targetStatus?.toLowerCase()}?
            {targetStatus === "completed" && (
              <span className="block mt-1 font-medium">
                This transfers payment to the seller
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => targetStatus && onConfirm(targetStatus)}
            disabled={isPending}
          >
            {isPending ? "Confirming..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
