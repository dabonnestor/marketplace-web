"use client"

import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { fetchListings } from "@/actions/listings"
import { ListingCard } from "@/components/listings/listing-card"
import { ListingFilters } from "@/components/listings/listing-filters"
import { PaginationControls } from "@/components/listings/pagination-controls"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

const CATEGORIES = ["Electronics", "Clothing", "Home", "Sports", "Books"]

export function ListingsContent() {
  const searchParams = useSearchParams()

  const params = {
    page: Number(searchParams.get("page")) || 1,
    category: searchParams.get("category") || undefined,
    search: searchParams.get("search") || undefined,
    minPrice: searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : undefined,
    maxPrice: searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : undefined,
  }

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["listings", params],
    queryFn: () => fetchListings(params),
  })

  if (isLoading) {
    return (
      <div>
        <ListingFilters categories={CATEGORIES} />
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
      <div>
        <ListingFilters categories={CATEGORIES} />
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">
            {data?.error ?? "Failed to load listings"}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  const { data: listings, pagination } = data

  if (listings.length === 0) {
    return (
      <div>
        <ListingFilters categories={CATEGORIES} />
        <div className="text-center py-16">
          <p className="text-muted-foreground">No listings found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search or filters.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <ListingFilters categories={CATEGORIES} />
      {isFetching && (
        <div className="fixed top-0 left-0 w-full h-0.5 bg-primary/20 z-50">
          <div className="h-full bg-primary animate-[pulse_1s_ease-in-out_infinite]" />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
      {pagination.totalPages > 1 && (
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.totalPages}
        />
      )}
    </div>
  )
}
