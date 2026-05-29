import { Suspense } from "react"
import { PurchaseHistory } from "@/components/orders/purchase-history"

export default function PurchasesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Purchases</h1>
      <Suspense>
        <PurchaseHistory />
      </Suspense>
    </div>
  )
}
