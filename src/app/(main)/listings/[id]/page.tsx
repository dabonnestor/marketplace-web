import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getListing, ApiRequestError } from "@/lib/api/client"
import { getCurrentUser } from "@/actions/auth"
import { ListingDetail } from "@/components/listings/listing-detail"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  try {
    const listing = await getListing(id)
    return {
      title: listing.title,
      description: listing.description,
    }
  } catch {
    return {
      title: "Listing",
      description: "View listing details",
    }
  }
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params

  let listing
  try {
    listing = await getListing(id)
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) {
      notFound()
    }
    throw e
  }

  const currentUser = await getCurrentUser()
  const currentUserId = currentUser?.id ?? null

  return <ListingDetail listing={listing} currentUserId={currentUserId} />
}
