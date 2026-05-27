import { z } from "zod"

export const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Sports & Outdoors",
  "Toys & Games",
  "Books & Media",
  "Collectibles",
  "Other",
] as const

export const CONDITIONS = [
  "New",
  "Like New",
  "Good",
  "Fair",
  "Poor",
] as const

export const createListingSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(1, "Description is required"),
  price: z.coerce
    .number()
    .positive("Price must be positive")
    .max(9_999_999_999, "Price is too high"),
  category: z.string().min(1, "Category is required"),
  condition: z.string().min(1, "Condition is required"),
  shippingCost: z.coerce.number().min(0, "Shipping cost cannot be negative").default(0),
  images: z.array(z.string().url()).max(10).default([]),
})

export type CreateListingInput = z.infer<typeof createListingSchema>
