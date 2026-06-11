"use server"

import { UTApi } from "uploadthing/server"

export async function uploadImages(formData: FormData) {
  const files = formData.getAll("files") as File[]

  if (files.length === 0) {
    return { success: true as const, urls: [] as string[] }
  }

  try {
    const utapi = new UTApi()
    const results = await utapi.uploadFiles(files)

    const urls = results.map((r) => {
      if (r.error) throw new Error(r.error.message)
      return r.data?.ufsUrl ?? r.data?.url ?? ""
    })

    return { success: true as const, urls }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to upload images",
    }
  }
}
