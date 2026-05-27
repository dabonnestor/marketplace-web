"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { Listing } from "@/lib/api/types"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const conditionBadgeClass: Record<string, string> = {
  "New": "bg-green-100 text-green-800 border-green-300",
  "Like New": "bg-emerald-100 text-emerald-800 border-emerald-300",
  "Good": "bg-blue-100 text-blue-800 border-blue-300",
  "Fair": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Poor": "bg-red-100 text-red-800 border-red-300",
}

function ActionButton({
  listing,
  currentUserId,
}: {
  listing: Listing
  currentUserId: string | null
}) {
  if (currentUserId === null) {
    return (
      <Button asChild className="w-full">
        <Link href="/login">Sign in to buy</Link>
      </Button>
    )
  }

  if (currentUserId === listing.sellerId) {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href={`/listings/${listing.id}/edit`}>Edit</Link>
      </Button>
    )
  }

  return (
    <Button asChild className="w-full">
      <Link href={`/listings/${listing.id}/buy`}>Buy Now</Link>
    </Button>
  )
}

export function ListingDetail({
  listing,
  currentUserId,
}: {
  listing: Listing
  currentUserId: string | null
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {listing.images.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto rounded-xl">
          {listing.images.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={listing.title}
              className="w-full rounded-xl object-cover aspect-video"
            />
          ))}
        </div>
      ) : (
        <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
          <p className="text-muted-foreground">No image</p>
        </div>
      )}

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{listing.title}</h1>
        <p className="text-3xl font-bold">${listing.price}</p>
      </div>

      <div className="flex gap-2">
        <Badge className={conditionBadgeClass[listing.condition] ?? ""}>
          {listing.condition}
        </Badge>
        <Badge className="border">{listing.category}</Badge>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Description</h2>
        <p className="whitespace-pre-wrap">{listing.description}</p>
      </div>

      <Separator />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>${listing.shippingCost}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Seller</span>
          <span>{listing.sellerId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Listed</span>
          <span>{formatDate(listing.createdAt)}</span>
        </div>
      </div>

      <ActionButton listing={listing} currentUserId={currentUserId} />
    </div>
  )
}
