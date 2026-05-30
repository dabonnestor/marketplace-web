import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardSalesLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-48" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-md" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}
