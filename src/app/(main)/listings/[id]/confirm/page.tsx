import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getListing, ApiRequestError } from "@/lib/api/client"
import { getCurrentUser } from "@/lib/api/actions"
import { ConfirmPurchase } from "@/components/listings/confirm-purchase"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  try {
    const listing = await getListing(id)
    return {
      title: `Confirm Purchase — ${listing.title}`,
    }
  } catch {
    return { title: "Confirm Purchase" }
  }
}

export default async function ConfirmPurchasePage({ params }: Props) {
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

  return (
    <Suspense>
      <ConfirmPurchase listing={listing} currentUserId={currentUserId} />
    </Suspense>
  )
}
