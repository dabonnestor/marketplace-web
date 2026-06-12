import { Suspense } from "react"
import { OrderList } from "@/components/orders/order-list"

export default function PurchasesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Purchases</h1>
      <Suspense>
        <OrderList role="buyer" />
      </Suspense>
    </div>
  )
}
