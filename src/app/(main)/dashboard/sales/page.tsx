import { Suspense } from "react"
import { SalesHistory } from "@/components/orders/sales-history"

export default function SalesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Sales</h1>
      <Suspense>
        <SalesHistory />
      </Suspense>
    </div>
  )
}
