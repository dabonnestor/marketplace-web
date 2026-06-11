"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { createListing, updateListing, deleteListing } from "@/lib/api/actions"
import { uploadImages } from "@/actions/upload"
import type { Listing } from "@/lib/api/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CreateListingFormProps {
  listing?: Listing
}

export function CreateListingForm({ listing }: CreateListingFormProps) {
  const isEdit = !!listing
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>(
    listing?.images ?? []
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const form = useForm<CreateListingInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createListingSchema) as any,
    defaultValues: {
      title: listing?.title ?? "",
      description: listing?.description ?? "",
      price: (listing ? parseFloat(listing.price) : "") as unknown as number,
      category: listing?.category ?? "",
      condition: listing?.condition ?? "",
      shippingCost: (listing
        ? parseFloat(listing.shippingCost)
        : "") as unknown as number,
      images: listing?.images ?? [],
    },
  })

  function setServerError(message: string) {
    const lower = message.toLowerCase()
    if (lower.includes("title")) form.setError("title", { message })
    else if (lower.includes("description")) form.setError("description", { message })
    else if (lower.includes("price")) form.setError("price", { message })
    else if (lower.includes("category")) form.setError("category", { message })
    else if (lower.includes("condition")) form.setError("condition", { message })
    else form.setError("title", { message })
  }

  const queryClient = useQueryClient()

  const { mutate: submitListing, isPending } = useMutation({
    mutationFn: async (data: CreateListingInput) => {
      let newImageUrls: string[] = []
      if (selectedFiles.length > 0) {
        const formData = new FormData()
        selectedFiles.forEach((f) => formData.append("files", f))
        const uploadResult = await uploadImages(formData)
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Failed to upload images")
        }
        newImageUrls = uploadResult.urls ?? []
      }

      const mergedImages = [...existingImages, ...newImageUrls]
      const payload = { ...data, images: mergedImages }

      if (isEdit) {
        return updateListing(listing.id, payload)
      }
      return createListing(payload)
    },
    onSuccess: (result) => {
      if (result.success && "listing" in result && result.listing) {
        queryClient.invalidateQueries({ queryKey: ["listings"] })
        queryClient.invalidateQueries({ queryKey: ["my-listings"] })
        toast.success(isEdit ? "Listing updated!" : "Listing created!")
        router.push(`/listings/${result.listing.id}`)
      } else {
        const message = result.error || `Failed to ${isEdit ? "update" : "create"} listing`
        setServerError(message)
        toast.error(message)
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    },
  })

  const { mutate: handleDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteListing(listing!.id),
    onSuccess: (result) => {
      setShowDeleteDialog(false)
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["listings"] })
        queryClient.invalidateQueries({ queryKey: ["my-listings"] })
        toast.success("Listing deleted")
        router.push("/listings")
      } else {
        toast.error(result.error || "Failed to delete listing")
      }
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

  function removeExistingImage(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  function onSubmit(data: CreateListingInput) {
    submitListing(data)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Listing" : "Create Listing"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Update your listing details below."
            : "Fill in the details below to list your item for sale."}
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

            {/* Existing images (edit mode only) */}
            {existingImages.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Current Images</p>
                <ul className="space-y-1">
                  {existingImages.map((url, i) => {
                    const filename = url.split("/").pop() ?? url
                    return (
                      <li
                        key={url}
                        className="flex items-center justify-between rounded-md bg-accent/50 px-3 py-1.5 text-sm"
                      >
                        <span className="truncate">{filename}</span>
                        <button
                          type="button"
                          aria-label="Remove"
                          className="ml-2 shrink-0 rounded p-0.5 hover:bg-accent"
                          onClick={() => removeExistingImage(i)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Image picker */}
            <div className="space-y-2">
              <label
                htmlFor="listing-images"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {isEdit ? "Add Images" : "Images"}
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
              {isPending
                ? isEdit
                  ? "Saving..."
                  : "Creating listing..."
                : isEdit
                  ? "Save Changes"
                  : "Create Listing"}
            </Button>

            {isEdit && (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete Listing
                </Button>
                <Dialog
                  open={showDeleteDialog}
                  onOpenChange={(open) => {
                    if (!open) setShowDeleteDialog(false)
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you sure?</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this listing? This
                        action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete()}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Confirm"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
