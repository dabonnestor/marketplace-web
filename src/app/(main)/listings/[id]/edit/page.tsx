import { notFound, redirect } from "next/navigation"
import { getListing, getMe, ApiRequestError } from "@/lib/api/client"
import { CreateListingForm } from "@/components/listings/create-listing-form"

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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
    redirect("/login")
  }

  if (!currentUserId || currentUserId !== listing.sellerId) {
    redirect(`/listings/${id}`)
  }

  return <CreateListingForm listing={listing} />
}
