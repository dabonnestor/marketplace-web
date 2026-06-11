import { PriceRow } from "@/components/ui/price-row"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/display-utils"
import type { Order } from "@/lib/api/types"

interface OrderSummaryProps {
  order: Order
  role: "buyer" | "seller" | "none"
}

export function OrderSummary({ order, role }: OrderSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {role === "seller" ? (
          <>
            <PriceRow label="Subtotal" amount={formatCurrency(order.subtotal)} />
            <PriceRow
              label="Platform fee"
              amount={`-${formatCurrency(order.platformFee)}`}
            />
            <Separator />
            <PriceRow label="Total" amount={formatCurrency(order.sellerPayout)} bold />
          </>
        ) : (
          <>
            <PriceRow label="Subtotal" amount={formatCurrency(order.subtotal)} />
            <PriceRow
              label="Shipping"
              amount={formatCurrency(order.shippingCost)}
            />
            <Separator />
            <PriceRow label="Total" amount={formatCurrency(order.total)} bold />
          </>
        )}
      </CardContent>
    </Card>
  )
}
