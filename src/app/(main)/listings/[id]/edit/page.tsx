import { notFound, redirect } from "next/navigation"
import { getListing, ApiRequestError } from "@/lib/api/client"
import { getCurrentUser } from "@/lib/api/actions"
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

  const currentUser = await getCurrentUser()
  const currentUserId = currentUser?.id ?? null
  if (!currentUserId) {
    redirect("/login")
  }

  if (!currentUserId || currentUserId !== listing.sellerId) {
    redirect(`/listings/${id}`)
  }

  return <CreateListingForm listing={listing} />
}
