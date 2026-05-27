"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createListingSchema,
  type CreateListingInput,
  CATEGORIES,
  CONDITIONS,
} from "@/lib/validations/listings"
import { createListing } from "@/actions/listings"
import { uploadImages } from "@/actions/upload"

export function CreateListingForm() {
  const [isPending, setIsPending] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const form = useForm<CreateListingInput>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "" as unknown as number,
      category: "",
      condition: "",
      shippingCost: "" as unknown as number,
      images: [],
    },
  })

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setSelectedFiles((prev) => [...prev, ...files])
    // Reset input so the same file can be re-selected
    e.target.value = ""
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function onSubmit(data: CreateListingInput) {
    setIsPending(true)

    // Upload images first if any
    let imageUrls: string[] = []
    if (selectedFiles.length > 0) {
      const formData = new FormData()
      selectedFiles.forEach((f) => formData.append("files", f))
      const uploadResult = await uploadImages(formData)
      if (!uploadResult.success) {
        setIsPending(false)
        toast.error(uploadResult.error || "Failed to upload images")
        return
      }
      imageUrls = uploadResult.urls ?? []
    }

    const result = await createListing({ ...data, images: imageUrls })
    setIsPending(false)

    if (result.success && result.listing) {
      toast.success("Listing created!")
      router.push(`/listings/${result.listing.id}`)
    } else {
      toast.error(result.error || "Failed to create listing")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Listing</CardTitle>
        <CardDescription>
          Fill in the details below to list your item for sale.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl className="mt-2">
                    <Input placeholder="e.g. Vintage Watch" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl className="mt-2">
                    <Textarea
                      placeholder="Describe your item..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl className="mt-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl className="mt-2">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl className="mt-2">
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CONDITIONS.map((cond) => (
                        <SelectItem key={cond} value={cond}>
                          {cond}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image picker */}
            <div className="space-y-2">
              <label
                htmlFor="listing-images"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Images
              </label>
              <div
                className="flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input px-4 py-6 text-sm text-muted-foreground hover:border-muted-foreground/50 mt-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <p>Click to upload images</p>
              </div>
              <input
                ref={fileInputRef}
                id="listing-images"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFilesSelected}
              />
              {selectedFiles.length > 0 && (
                <ul className="space-y-1">
                  {selectedFiles.map((file, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="flex items-center justify-between rounded-md bg-accent/50 px-3 py-1.5 text-sm"
                    >
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        aria-label="Remove"
                        className="ml-2 shrink-0 rounded p-0.5 hover:bg-accent"
                        onClick={() => removeFile(i)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Creating listing..." : "Create Listing"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
