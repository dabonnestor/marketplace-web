"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteListing } from "@/actions/listings"
import type { Listing } from "@/lib/api/types"
import { conditionBadgeClass, NoImage } from "@/lib/display-utils"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function ActionButton({
  listing,
  currentUserId,
}: {
  listing: Listing
  currentUserId: string | null
}) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteListing(listing.id)
    setIsDeleting(false)
    setShowDeleteDialog(false)

    if (result.success) {
      toast.success("Listing deleted")
      router.push("/listings")
    } else {
      toast.error(result.error || "Failed to delete listing")
    }
  }

  if (currentUserId === null) {
    return (
      <Button asChild className="w-full">
        <Link href="/login">Sign in to buy</Link>
      </Button>
    )
  }

  if (currentUserId === listing.sellerId) {
    return (
      <>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/listings/${listing.id}/edit`}>Edit</Link>
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete
          </Button>
        </div>
        <Dialog
          open={showDeleteDialog}
          onOpenChange={(open) => {
            if (!open) setShowDeleteDialog(false)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this listing? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <Button asChild className="w-full">
      <Link href={`/listings/${listing.id}/confirm`}>Buy Now</Link>
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
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory rounded-xl">
          {listing.images.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={listing.title}
              className="w-full shrink-0 snap-center rounded-xl object-cover aspect-video"
            />
          ))}
        </div>
      ) : (
        <NoImage className="aspect-video rounded-xl" />
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
