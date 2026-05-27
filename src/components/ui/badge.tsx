import { cn } from "@/lib/utils"
import { forwardRef, type HTMLAttributes } from "react"

const Badge = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground shadow",
        className
      )}
      {...props}
    />
  )
)
Badge.displayName = "Badge"

export { Badge }
