export function PriceRow({
  label,
  amount,
  bold,
}: {
  label: string
  amount: string
  bold?: boolean
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className={bold ? "font-semibold" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={bold ? "font-semibold" : ""}>{amount}</span>
    </div>
  )
}
