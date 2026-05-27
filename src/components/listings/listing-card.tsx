"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Listing } from "@/lib/api/types"

const conditionBadgeClass: Record<string, string> = {
  "New": "bg-green-100 text-green-800 border-green-300",
  "Like New": "bg-emerald-100 text-emerald-800 border-emerald-300",
  "Good": "bg-blue-100 text-blue-800 border-blue-300",
  "Fair": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Poor": "bg-red-100 text-red-800 border-red-300",
}

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow">
        <div className="aspect-video bg-muted rounded-t-xl flex items-center justify-center">
          {listing.images[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover rounded-t-xl"
            />
          ) : (
            <span className="text-muted-foreground text-sm">No image</span>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-medium truncate">{listing.title}</h3>
          <p className="text-lg font-bold">${listing.price}</p>
          <div className="flex gap-2">
            <Badge className={conditionBadgeClass[listing.condition] ?? ""}>
              {listing.condition}
            </Badge>
            <Badge className="border">{listing.category}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
