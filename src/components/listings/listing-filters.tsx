"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ListingFilters({ categories }: { categories: readonly string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const updateParams = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(overrides)) {
        if (value && value !== "all") {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      params.set("page", "1")
      router.push(`/listings?${params.toString()}`)
    },
    [router, searchParams]
  )

  // When debounced search changes, update URL
  useEffect(() => {
    if (debouncedSearch !== (searchParams.get("search") || "")) {
      updateParams({ search: debouncedSearch || undefined })
    }
    // Intentionally omit updateParams to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  return (
    <div className="flex flex-col md:flex-row gap-3 mb-6">
      <Input
        placeholder="Search listings..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:max-w-sm min-h-11"
      />
      <Select
        value={searchParams.get("category") || "all"}
        onValueChange={(v) => updateParams({ category: v })}
      >
        <SelectTrigger className="w-full md:w-[180px] min-h-11">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder="Min"
        type="number"
        defaultValue={searchParams.get("minPrice") || ""}
        onBlur={(e) => updateParams({ minPrice: e.target.value || undefined })}
        className="w-full md:w-[100px] min-h-11"
      />
      <Input
        placeholder="Max"
        type="number"
        defaultValue={searchParams.get("maxPrice") || ""}
        onBlur={(e) => updateParams({ maxPrice: e.target.value || undefined })}
        className="w-full md:w-[100px] min-h-11"
      />
    </div>
  )
}
