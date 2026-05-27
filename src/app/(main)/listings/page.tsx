import { Suspense } from "react"
import { ListingsContent } from "@/components/listings/listings-content"

export default function ListingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Browse Listings</h1>
      <Suspense>
        <ListingsContent />
      </Suspense>
    </div>
  )
}
