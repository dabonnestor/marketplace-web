"use client"

import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { fetchMyListings } from "@/lib/api/actions"
import { ListingCard } from "@/components/listings/listing-card"
import { PaginationControls } from "@/components/listings/pagination-controls"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export function MyListings() {
  const searchParams = useSearchParams()
  const page = Number(searchParams.get("page")) || 1
  const limit = 6

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-listings", { page }],
    queryFn: () => fetchMyListings({ page, limit }),
  })

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading your listings">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data || !data.success) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">
          {data?.error ?? "Failed to load your listings"}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  const { data: listings, pagination } = data

  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">
          You haven&apos;t created any listings yet — create your first listing!
        </p>
        <Button asChild>
          <Link href="/listings/new">Create listing</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            showStatus
            showEditButton
          />
        ))}
      </div>
      {pagination.totalPages > 1 && (
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.totalPages}
          baseUrl="/dashboard/listings"
        />
      )}
    </div>
  )
}
