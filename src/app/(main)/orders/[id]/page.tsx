import { notFound } from "next/navigation"
import { getOrder, getListing, ApiRequestError } from "@/lib/api/client"
import { getCurrentUser } from "@/actions/auth"
import { OrderDetail } from "@/components/orders/order-detail"

type Props = {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params

  const currentUser = await getCurrentUser()
  const currentUserId = currentUser?.id ?? null

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

  return (
    <OrderDetail
      order={order}
      listing={listing}
      currentUserId={currentUserId}
    />
  )
}
