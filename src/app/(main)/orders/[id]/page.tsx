import { notFound } from "next/navigation"
import { getOrder, getListing, getMe, ApiRequestError } from "@/lib/api/client"
import { OrderDetail } from "@/components/orders/order-detail"

type Props = {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params

  let order
  try {
    order = await getOrder(id)
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) {
      notFound()
    }
    throw e
  }

  let listing
  try {
    listing = await getListing(order.listingId)
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

  return (
    <OrderDetail
      order={order}
      listing={listing}
      currentUserId={currentUserId}
    />
  )
}
