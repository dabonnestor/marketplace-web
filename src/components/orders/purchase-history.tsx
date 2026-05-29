"use client"

import { useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { fetchPurchases } from "@/actions/orders"
import type { PurchaseOrder, Pagination } from "@/lib/api/types"
import { statusColor, statusLabel } from "@/lib/order-utils"
import { PaginationControls } from "@/components/listings/pagination-controls"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

const STATUSES = ["pending", "paid", "shipped", "delivered", "completed", "cancelled"] as const

const badgeClasses: Record<string, string> = {
  gray: "bg-gray-100 text-gray-800 border-gray-300",
  blue: "bg-blue-100 text-blue-800 border-blue-300",
  orange: "bg-orange-100 text-orange-800 border-orange-300",
  green: "bg-green-100 text-green-800 border-green-300",
  red: "bg-red-100 text-red-800 border-red-300",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

function StatusTabs({
  status,
  onSelect,
}: {
  status: string | undefined
  onSelect: (s: string | null) => void
}) {
  return (
    <div role="tablist" className="flex gap-1 mb-4 flex-wrap">
      <button
        role="tab"
        aria-selected={!status}
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 text-sm rounded-md ${
          !status
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        }`}
      >
        All
      </button>
      {STATUSES.map((s) => (
        <button
          key={s}
          role="tab"
          aria-selected={status === s}
          onClick={() => onSelect(s)}
          className={`px-3 py-1.5 text-sm rounded-md capitalize ${
            status === s
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          {statusLabel(s)}
        </button>
      ))}
    </div>
  )
}

export function PurchaseHistory() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get("page")) || 1
  const status = searchParams.get("status") || undefined

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["purchases", { page, status }],
    queryFn: () => fetchPurchases({ page, status }),
  })

  const setStatus = useCallback(
    (newStatus: string | null) => {
      const params = new URLSearchParams()
      if (newStatus) params.set("status", newStatus)
      router.push(`/dashboard/purchases${newStatus ? `?${params.toString()}` : ""}`)
    },
    [router]
  )

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading purchases">
        <div className="flex gap-1 mb-4 flex-wrap">
          <div className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground">
            All
          </div>
          {STATUSES.map((s) => (
            <div
              key={s}
              className="px-3 py-1.5 text-sm rounded-md capitalize text-muted-foreground"
            >
              {statusLabel(s)}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
              <Skeleton className="h-16 w-16 shrink-0 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
                <Skeleton className="h-5 w-20 ml-auto rounded-full" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data || !data.success) {
    return (
      <div>
        <StatusTabs status={status} onSelect={setStatus} />
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">
            {data?.error ?? "Failed to load purchases"}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  const { data: purchases, pagination } = data as {
    data: PurchaseOrder[]
    pagination: Pagination
  }

  if (purchases.length === 0) {
    return (
      <div>
        <StatusTabs status={status} onSelect={setStatus} />
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">
            No purchases yet — start browsing!
          </p>
          <a
            href="/listings"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            Browse listings
          </a>
        </div>
      </div>
    )
  }

  return (
    <div>
      <StatusTabs status={status} onSelect={setStatus} />
      <div className="space-y-2">
        {purchases.map((p) => {
          const color = statusColor(p.status)
          const badgeClass = badgeClasses[color] ?? badgeClasses.gray

          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/orders/${p.id}`)}
              className="grid grid-cols-[64px_1fr_auto_auto_auto] items-center gap-4 lg:gap-6 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {p.listingImage ? (
                  <img
                    src={p.listingImage}
                    alt={p.listingTitle}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{p.listingTitle}</p>
                <p className="text-sm text-muted-foreground">{p.sellerName}</p>
              </div>
              <p className="font-medium tabular-nums w-20 text-right">${p.total}</p>
              <span
                className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium w-24 text-center ${badgeClass}`}
              >
                {statusLabel(p.status)}
              </span>
              <p className="text-sm text-muted-foreground tabular-nums w-24 text-right">
                {formatDate(p.createdAt)}
              </p>
            </div>
          )
        })}
      </div>
      {pagination.totalPages > 1 && (
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.totalPages}
          baseUrl="/dashboard/purchases"
        />
      )}
    </div>
  )
}
