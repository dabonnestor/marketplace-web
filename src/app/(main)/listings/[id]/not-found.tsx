import Link from "next/link"

export default function ListingNotFound() {
  return (
    <div className="max-w-3xl mx-auto p-4 text-center space-y-4">
      <h2 className="text-xl font-semibold">Listing not found</h2>
      <p className="text-muted-foreground">
        This listing may have been removed or does not exist.
      </p>
      <Link
        href="/listings"
        className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
      >
        Browse listings
      </Link>
    </div>
  )
}
