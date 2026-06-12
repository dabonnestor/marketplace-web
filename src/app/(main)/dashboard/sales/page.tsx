import { Suspense } from "react"
import { OrderList } from "@/components/orders/order-list"

export default function SalesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Sales</h1>
      <Suspense>
        <OrderList role="seller" />
      </Suspense>
    </div>
  )
}
