import { Skeleton } from "@/components/ui/skeleton"

export default function ListingDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      <Skeleton className="aspect-video w-full rounded-xl" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-6 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-24 rounded-md" />
      </div>
      <div className="border-t pt-4 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  )
}
