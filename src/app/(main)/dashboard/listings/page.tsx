import { Suspense } from "react"
import { MyListings } from "@/components/listings/my-listings"

export default function MyListingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Listings</h1>
      <Suspense>
        <MyListings />
      </Suspense>
    </div>
  )
}
