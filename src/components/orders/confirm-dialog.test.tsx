import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ConfirmDialog } from "@/components/orders/confirm-dialog"

describe("ConfirmDialog", () => {
  it("renders the title and description, and calls onConfirm when the confirm button is clicked", async () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    const user = userEvent.setup()

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
        title="Confirm Cancellation"
        description="Are you sure you want to cancel this order?"
        confirmPendingLabel="Cancelling..."
      />
    )

    expect(screen.getByText("Confirm Cancellation")).toBeInTheDocument()
    expect(
      screen.getByText("Are you sure you want to cancel this order?")
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Confirm" }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it("shows confirmPendingLabel on the confirm button when isPending is true", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={true}
        title="Confirm Refund"
        description="Are you sure?"
        confirmPendingLabel="Requesting..."
      />
    )

    expect(screen.getByRole("button", { name: "Requesting..." })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Requesting..." })).toBeDisabled()
  })

  it("shows the warning text when provided", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
        title="Confirm Action"
        description="Are you sure you want to mark this order as completed?"
        warning="This transfers payment to the seller"
      />
    )

    expect(
      screen.getByText("This transfers payment to the seller")
    ).toBeInTheDocument()
  })

  it("does not render a warning span when warning is not provided", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
        title="Confirm"
        description="Proceed?"
      />
    )

    expect(screen.getByText("Proceed?")).toBeInTheDocument()
    // The description text should exist, but there should be no nested span with font-medium
    const descriptionEl = screen.getByText("Proceed?")
    expect(descriptionEl.querySelector("span")).toBeNull()
  })

  it("clicking the cancel button calls onOpenChange(false)", async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={vi.fn()}
        isPending={false}
        title="Confirm"
        description="Proceed?"
      />
    )

    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
