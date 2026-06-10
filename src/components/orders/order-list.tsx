"use client"

import { useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { fetchPurchases, fetchSales } from "@/actions/orders"
import type { PurchaseOrder, SaleOrder, Pagination } from "@/lib/api/types"
import { statusColor, statusLabel } from "@/lib/order-utils"
import { badgeClasses, NoImage } from "@/lib/display-utils"
import { PaginationControls } from "@/components/listings/pagination-controls"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

type Order = PurchaseOrder | SaleOrder
type Role = "buyer" | "seller"

const STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "completed",
  "disputed",
  "cancelled",
  "expired",
  "refunded",
] as const

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

const CONFIG: Record<
  Role,
  {
    queryKey: string
    fetcher: typeof fetchPurchases
    baseUrl: string
    counterpartyField: "sellerName" | "buyerName"
    loadingLabel: string
    errorMessage: string
    emptyMessage: string
    emptyCtaHref: string
    emptyCtaLabel: string
  }
> = {
  buyer: {
    queryKey: "purchases",
    fetcher: fetchPurchases,
    baseUrl: "/dashboard/purchases",
    counterpartyField: "sellerName",
    loadingLabel: "Loading purchases",
    errorMessage: "Failed to load purchases",
    emptyMessage: "No purchases yet — start browsing!",
    emptyCtaHref: "/listings",
    emptyCtaLabel: "Browse listings",
  },
  seller: {
    queryKey: "sales",
    fetcher: fetchSales,
    baseUrl: "/dashboard/sales",
    counterpartyField: "buyerName",
    loadingLabel: "Loading sales",
    errorMessage: "Failed to load sales",
    emptyMessage: "No sales yet — create a listing to get started!",
    emptyCtaHref: "/listings/new",
    emptyCtaLabel: "Create a listing",
  },
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
          !status ? "bg-primary text-primary-foreground" : "hover:bg-muted"
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

interface OrderListProps {
  role: Role
}

export function OrderList({ role }: OrderListProps) {
  const cfg = CONFIG[role]
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get("page")) || 1
  const limit = 5
  const status = searchParams.get("status") || undefined

  const { data, isLoading, refetch } = useQuery({
    queryKey: [cfg.queryKey, { page, status }],
    queryFn: () => cfg.fetcher({ page, limit, status }),
  })

  const setStatus = useCallback(
    (newStatus: string | null) => {
      const params = new URLSearchParams()
      if (newStatus) params.set("status", newStatus)
      router.push(`${cfg.baseUrl}${newStatus ? `?${params.toString()}` : ""}`)
    },
    [router, cfg.baseUrl],
  )

  if (isLoading) {
    return (
      <div role="status" aria-label={cfg.loadingLabel}>
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
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg border p-4"
            >
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
            {data?.error ?? cfg.errorMessage}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  const { data: orders, pagination } = data as {
    data: Order[]
    pagination: Pagination
  }

  if (orders.length === 0) {
    return (
      <div>
        <StatusTabs status={status} onSelect={setStatus} />
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">{cfg.emptyMessage}</p>
          <Link
            href={cfg.emptyCtaHref}
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            {cfg.emptyCtaLabel}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <StatusTabs status={status} onSelect={setStatus} />
      <div className="space-y-2">
        {orders.map((order) => {
          const color = statusColor(order.status)
          const badgeClass = badgeClasses[color] ?? badgeClasses.gray

          return (
            <div
              key={order.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/orders/${order.id}`)}
              className="grid grid-cols-[64px_1fr_auto_auto_auto] items-center gap-4 lg:gap-6 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {order.listingImage ? (
                  <img
                    src={order.listingImage}
                    alt={order.listingTitle}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <NoImage className="h-full w-full" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{order.listingTitle}</p>
                <p className="text-sm text-muted-foreground">
                  {order[cfg.counterpartyField]}
                </p>
              </div>
              <p className="font-medium tabular-nums w-20 text-right">
                ${order.total}
              </p>
              <span
                className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium w-24 text-center ${badgeClass}`}
              >
                {statusLabel(order.status)}
              </span>
              <p className="text-sm text-muted-foreground tabular-nums w-24 text-right">
                {formatDate(order.createdAt)}
              </p>
            </div>
          )
        })}
      </div>
      {pagination.totalPages > 1 && (
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.totalPages}
          baseUrl={cfg.baseUrl}
        />
      )}
    </div>
  )
}
