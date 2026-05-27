import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getListing, getMe, ApiRequestError } from "@/lib/api/client"
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

  let currentUserId: string | null = null
  try {
    const user = await getMe()
    currentUserId = user?.id ?? null
  } catch {
    // Not authenticated — that's fine
  }

  return <ListingDetail listing={listing} currentUserId={currentUserId} />
}
