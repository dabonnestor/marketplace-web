import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending: boolean
  title: string
  description: React.ReactNode
  confirmLabel?: string
  confirmPendingLabel?: string
  warning?: string
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  title,
  description,
  confirmLabel = "Confirm",
  confirmPendingLabel = "Confirming...",
  warning,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
            {warning && (
              <span className="block mt-1 font-medium">{warning}</span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? confirmPendingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
