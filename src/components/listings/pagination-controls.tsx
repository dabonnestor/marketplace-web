"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export function PaginationControls({
  page,
  totalPages,
  baseUrl,
}: {
  page: number
  totalPages: number
  baseUrl?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigate = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("page", String(newPage))
      const path = baseUrl ?? "/listings"
      router.push(`${path}?${params.toString()}`)
    },
    [router, searchParams, baseUrl]
  )

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => navigate(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => navigate(page + 1)}
      >
        Next
      </Button>
    </div>
  )
}
