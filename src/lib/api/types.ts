// Types mirroring the marketplace API contract

export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt?: string
}

export interface Listing {
  id: string
  sellerId: string
  title: string
  description: string
  price: string
  category: string
  condition: string
  shippingCost: string
  images: string[]
  status: "active" | "sold"
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  buyerId: string
  sellerId: string
  listingId: string
  status: OrderStatus
  subtotal: string
  shippingCost: string
  platformFee: string
  total: string
  sellerPayout: string
  clientSecret?: string
  stripePaymentIntentId?: string
  stripeTransferId?: string
  stripeRefundId?: string
  preDisputeStatus?: OrderStatus
  paidAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "completed"
  | "disputed"
  | "cancelled"

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: Pagination
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

// Request types
export interface CreateListingInput {
  title: string
  description: string
  price: number
  category: string
  condition: string
  shippingCost?: number
  images?: string[]
}

export interface UpdateListingInput extends Partial<CreateListingInput> {}

export interface PurchaseOrder extends Order {
  listingTitle: string
  listingImage: string | null
  sellerName: string
}

export interface SaleOrder extends Order {
  listingTitle: string
  listingImage: string | null
  buyerName: string
}

export interface OrderStatusTransition {
  status: Exclude<OrderStatus, "pending">
}

// Stripe Connect
export interface OnboardSellerResponse {
  url: string
}

export interface OnboardStatusResponse {
  onboarded: boolean
  chargesEnabled: boolean
  detailsSubmitted: boolean
}
