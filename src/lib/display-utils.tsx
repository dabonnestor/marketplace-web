export function formatCurrency(amount: string): string {
  return `$${parseFloat(amount).toFixed(2)}`
}

export const badgeClasses: Record<string, string> = {
  gray: "bg-gray-100 text-gray-800 border-gray-300",
  blue: "bg-blue-100 text-blue-800 border-blue-300",
  orange: "bg-orange-100 text-orange-800 border-orange-300",
  green: "bg-green-100 text-green-800 border-green-300",
  red: "bg-red-100 text-red-800 border-red-300",
}

export const conditionBadgeClass: Record<string, string> = {
  "New": "bg-green-100 text-green-800 border-green-300",
  "Like New": "bg-emerald-100 text-emerald-800 border-emerald-300",
  "Good": "bg-blue-100 text-blue-800 border-blue-300",
  "Fair": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Poor": "bg-red-100 text-red-800 border-red-300",
}

export const statusBadgeClass: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-300",
  sold: "bg-gray-100 text-gray-800 border-gray-300",
}

export function NoImage({ className }: { className?: string }) {
  return (
    <div
      className={`bg-muted flex items-center justify-center ${className ?? ""}`}
    >
      <span className="text-muted-foreground text-sm">No image</span>
    </div>
  )
}
