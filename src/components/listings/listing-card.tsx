"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Listing } from "@/lib/api/types"
import {
  conditionBadgeClass,
  statusBadgeClass,
  NoImage,
} from "@/lib/display-utils"

export function ListingCard({
  listing,
  showStatus,
  showEditButton,
}: {
  listing: Listing
  showStatus?: boolean
  showEditButton?: boolean
}) {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <Link href={`/listings/${listing.id}`}>
        <div className="aspect-video bg-muted rounded-t-xl flex items-center justify-center">
          {listing.images[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover rounded-t-xl"
            />
          ) : (
            <NoImage className="aspect-video rounded-t-xl" />
          )}
        </div>
      </Link>
      <CardContent className="p-4 space-y-2">
        <Link href={`/listings/${listing.id}`}>
          <h3 className="font-medium truncate">{listing.title}</h3>
        </Link>
        <p className="text-lg font-bold">${listing.price}</p>
        <div className="flex gap-2 flex-wrap">
          {showStatus && listing.status in statusBadgeClass && (
            <Badge className={statusBadgeClass[listing.status]}>
              {listing.status === "active" ? "Active" : "Sold"}
            </Badge>
          )}
          {!showStatus && (
            <Badge className={conditionBadgeClass[listing.condition] ?? ""}>
              {listing.condition}
            </Badge>
          )}
          <Badge className="border">{listing.category}</Badge>
        </div>
        {showEditButton && (
          <Button variant="outline" size="sm" className="w-full mt-2" asChild>
            <Link href={`/listings/${listing.id}/edit`}>Edit</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
