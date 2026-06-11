import React, { createContext, useContext, type ReactNode } from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CreateListingForm } from "@/components/listings/create-listing-form"
import type { Listing } from "@/lib/api/types"

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})

function renderWithClient(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })
}

const { mockPush, mockCreateListing, mockUpdateListing, mockDeleteListing, mockSuccessToast, mockErrorToast, mockUploadImages } =
  vi.hoisted(() => ({
    mockPush: vi.fn(),
    mockCreateListing: vi.fn(),
    mockUpdateListing: vi.fn(),
    mockDeleteListing: vi.fn(),
    mockSuccessToast: vi.fn(),
    mockErrorToast: vi.fn(),
    mockUploadImages: vi.fn(),
  }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/lib/api/actions", () => ({
  createListing: mockCreateListing,
  updateListing: mockUpdateListing,
  deleteListing: mockDeleteListing,
}))

vi.mock("@/actions/upload", () => ({
  uploadImages: mockUploadImages,
}))

vi.mock("sonner", () => ({
  toast: { success: mockSuccessToast, error: mockErrorToast },
}))

// Radix Select relies on pointer events + portals that jsdom doesn't support.
// Replace with a native <select> — Radix behavior is trusted.
//
// Key design: SelectTrigger renders <select> (receives id from FormControl Slot),
// and SelectContent's <option> children are collected via context so they render
// inside <select>.
vi.mock("@/components/ui/select", () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Ctx {
    value?: string
    onValueChange?: (v: string) => void
    options: ReactNode
    setOptions: (n: ReactNode) => void
  }
  const SelectContext = createContext<Ctx>({
    options: null,
    setOptions: () => {},
  })

  function Select({ onValueChange, value, children }: any) {
    const [options, setOptions] = React.useState<ReactNode>(null)
    return (
      <SelectContext.Provider
        value={{ value, onValueChange, options, setOptions }}
      >
        {children}
      </SelectContext.Provider>
    )
  }

  function SelectTrigger({ children, ...props }: any) {
    const ctx = useContext(SelectContext)
    return (
      <select
        {...props}
        value={ctx.value || ""}
        onChange={(e) => ctx.onValueChange?.(e.target.value)}
      >
        {children}
        {ctx.options}
      </select>
    )
  }

  function SelectValue({ placeholder }: any) {
    return (
      <option value="" disabled>
        {placeholder}
      </option>
    )
  }

  function SelectContent({ children }: any) {
    const ctx = useContext(SelectContext)
    const set = ctx.setOptions
    React.useEffect(() => {
      set(children)
    }, [children, set])
    return null
  }

  function SelectItem({ value, children }: any) {
    return <option value={value}>{children}</option>
  }

  function SelectGroup({ children }: any) {
    return <>{children}</>
  }

  return {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    SelectGroup,
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
})

async function fillValidForm() {
  const user = userEvent.setup()
  renderWithClient(<CreateListingForm />)

  await user.type(screen.getByLabelText("Title"), "Test Watch")
  await user.type(screen.getByLabelText("Description"), "A nice watch")
  await user.type(screen.getByLabelText("Price"), "150")
  await user.selectOptions(screen.getByLabelText("Category"), "Electronics")
  await user.selectOptions(screen.getByLabelText("Condition"), "Good")

  return user
}

describe("CreateListingForm", () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockCreateListing.mockClear()
    mockUpdateListing.mockClear()
    mockDeleteListing.mockClear()
    mockSuccessToast.mockClear()
    mockErrorToast.mockClear()
    mockUploadImages.mockClear()
  })

  it("renders all required fields", () => {
    renderWithClient(<CreateListingForm />)

    expect(screen.getByLabelText("Title")).toBeInTheDocument()
    expect(screen.getByLabelText("Description")).toBeInTheDocument()
    expect(screen.getByLabelText("Price")).toBeInTheDocument()
    expect(screen.getByLabelText("Category")).toBeInTheDocument()
    expect(screen.getByLabelText("Condition")).toBeInTheDocument()

    expect(screen.getByRole("button", { name: /create listing/i })).toBeInTheDocument()
  })

  it("shows validation errors when submitted empty", async () => {
    const user = userEvent.setup()
    renderWithClient(<CreateListingForm />)

    await user.click(screen.getByRole("button", { name: /create listing/i }))

    await waitFor(() => {
      expect(screen.getByText("Title is required")).toBeInTheDocument()
      expect(screen.getByText("Description is required")).toBeInTheDocument()
      expect(screen.getByText("Category is required")).toBeInTheDocument()
      expect(screen.getByText("Condition is required")).toBeInTheDocument()
    })
  })

  it("shows error for negative price", async () => {
    const user = userEvent.setup()
    renderWithClient(<CreateListingForm />)

    const priceInput = screen.getByLabelText("Price")
    await user.type(priceInput, "-5")
    await user.click(screen.getByRole("button", { name: /create listing/i }))

    await waitFor(() => {
      expect(screen.getByText("Price must be positive")).toBeInTheDocument()
    })
  })

  it("submits successfully and redirects", async () => {
    mockUploadImages.mockResolvedValue({ success: true, urls: [] })
    mockCreateListing.mockResolvedValue({
      success: true,
      listing: { id: "new-123" },
    })

    const user = await fillValidForm()
    await user.click(screen.getByRole("button", { name: /create listing/i }))

    await waitFor(() => {
      expect(mockCreateListing).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Watch",
          description: "A nice watch",
          price: 150,
          category: "Electronics",
          condition: "Good",
        })
      )
      expect(mockPush).toHaveBeenCalledWith("/listings/new-123")
    })
  })

  it("shows error toast when server action fails", async () => {
    mockCreateListing.mockResolvedValue({
      success: false,
      error: "Something went wrong",
    })

    const user = await fillValidForm()
    await user.click(screen.getByRole("button", { name: /create listing/i }))

    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalledWith("Something went wrong")
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("maps server error to title field when error mentions title", async () => {
    mockCreateListing.mockResolvedValue({
      success: false,
      error: "A listing with this title already exists",
    })

    const user = await fillValidForm()
    await user.click(screen.getByRole("button", { name: /create listing/i }))

    await waitFor(() => {
      expect(
        screen.getByText("A listing with this title already exists")
      ).toBeInTheDocument()
    })
  })

  it("shows loading state during submission", async () => {
    // Never resolve — keeps the form in pending state
    let resolvePromise: (v: unknown) => void
    const pending = new Promise((resolve) => {
      resolvePromise = resolve
    })
    mockCreateListing.mockReturnValue(pending)

    const user = await fillValidForm()
    await user.click(screen.getByRole("button", { name: /create listing/i }))

    // Button should show pending state
    expect(
      screen.getByRole("button", { name: /creating listing/i })
    ).toBeInTheDocument()
    expect(screen.getByRole("button")).toBeDisabled()

    // Resolve so the test can clean up
    resolvePromise!({ success: true, listing: { id: "new-123" } })
  })

  describe("edit mode", () => {
    const editListing: Listing = {
      id: "edit-123",
      sellerId: "seller-1",
      sellerName: "Test Seller",
      title: "Vintage Watch",
      description: "A beautiful vintage watch",
      price: "99.99",
      category: "Electronics",
      condition: "Like New",
      shippingCost: "5.00",
      images: ["https://example.com/watch.jpg"],
      status: "active",
      createdAt: "2025-01-01",
      updatedAt: "2025-01-02",
    }

    it("pre-populates form fields with existing listing data", () => {
      renderWithClient(<CreateListingForm listing={editListing} />)

      expect(screen.getByLabelText("Title")).toHaveValue("Vintage Watch")
      expect(screen.getByLabelText("Description")).toHaveValue(
        "A beautiful vintage watch"
      )
      expect(screen.getByLabelText("Price")).toHaveValue(99.99)
      expect(screen.getByLabelText("Category")).toHaveValue("Electronics")
      expect(screen.getByLabelText("Condition")).toHaveValue("Like New")
    })

    it("renders edit-specific title and submit button", () => {
      renderWithClient(<CreateListingForm listing={editListing} />)

      expect(screen.getByText("Edit Listing")).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /save changes/i })
      ).toBeInTheDocument()
    })

    it("shows existing image URLs with remove buttons", () => {
      renderWithClient(<CreateListingForm listing={editListing} />)

      expect(screen.getByText(/watch\.jpg/)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument()
    })

    it("removes an existing image when the remove button is clicked", async () => {
      const user = userEvent.setup()
      renderWithClient(<CreateListingForm listing={editListing} />)

      expect(screen.getByText(/watch\.jpg/)).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: /remove/i }))
      expect(screen.queryByText(/watch\.jpg/)).not.toBeInTheDocument()
    })

    it("calls updateListing on submit and redirects", async () => {
      mockUpdateListing.mockResolvedValue({
        success: true,
        listing: { id: "edit-123" },
      })

      const user = userEvent.setup()
      renderWithClient(<CreateListingForm listing={editListing} />)

      // Change title to trigger a modification
      const titleInput = screen.getByLabelText("Title")
      await user.clear(titleInput)
      await user.type(titleInput, "Updated Watch")

      await user.click(
        screen.getByRole("button", { name: /save changes/i })
      )

      await waitFor(() => {
        expect(mockUpdateListing).toHaveBeenCalledWith(
          "edit-123",
          expect.objectContaining({
            title: "Updated Watch",
            description: "A beautiful vintage watch",
            price: 99.99,
            category: "Electronics",
            condition: "Like New",
          })
        )
        expect(mockPush).toHaveBeenCalledWith("/listings/edit-123")
        expect(mockSuccessToast).toHaveBeenCalled()
      })
    })

    it("shows error toast when updateListing fails", async () => {
      mockUpdateListing.mockResolvedValue({
        success: false,
        error: "Update failed",
      })

      const user = userEvent.setup()
      renderWithClient(<CreateListingForm listing={editListing} />)

      await user.click(
        screen.getByRole("button", { name: /save changes/i })
      )

      await waitFor(() => {
        expect(mockErrorToast).toHaveBeenCalledWith("Update failed")
      })
      expect(mockPush).not.toHaveBeenCalled()
    })

    it("keeps existing images if no new files are uploaded", async () => {
      mockUpdateListing.mockResolvedValue({
        success: true,
        listing: { id: "edit-123" },
      })

      const user = userEvent.setup()
      renderWithClient(<CreateListingForm listing={editListing} />)

      await user.click(
        screen.getByRole("button", { name: /save changes/i })
      )

      await waitFor(() => {
        expect(mockUpdateListing).toHaveBeenCalledWith(
          "edit-123",
          expect.objectContaining({
            images: ["https://example.com/watch.jpg"],
          })
        )
      })
    })

    it("supports adding new images alongside existing ones", async () => {
      mockUploadImages.mockResolvedValue({
        success: true,
        urls: ["https://example.com/new.jpg"],
      })
      mockUpdateListing.mockResolvedValue({
        success: true,
        listing: { id: "edit-123" },
      })

      const user = userEvent.setup()
      renderWithClient(<CreateListingForm listing={editListing} />)

      // Upload a new file (label is "Add Images" in edit mode)
      const file = new File(["new"], "new.jpg", { type: "image/jpeg" })
      const fileInput = screen.getByLabelText("Add Images") as HTMLInputElement
      await user.upload(fileInput, file)

      await user.click(
        screen.getByRole("button", { name: /save changes/i })
      )

      await waitFor(() => {
        expect(mockUpdateListing).toHaveBeenCalledWith(
          "edit-123",
          expect.objectContaining({
            images: [
              "https://example.com/watch.jpg",
              "https://example.com/new.jpg",
            ],
          })
        )
      })
    })

    it("shows loading state during edit submission", async () => {
      let resolvePromise: (v: unknown) => void
      const pending = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockUpdateListing.mockReturnValue(pending)

      const user = userEvent.setup()
      renderWithClient(<CreateListingForm listing={editListing} />)

      await user.click(
        screen.getByRole("button", { name: /save changes/i })
      )

      expect(
        screen.getByRole("button", { name: /saving/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /saving/i })
      ).toBeDisabled()

      resolvePromise!({ success: true, listing: { id: "edit-123" } })
    })

    it("shows Delete button only in edit mode", () => {
      const { rerender } = renderWithClient(
        <CreateListingForm listing={editListing} />
      )

      expect(
        screen.getByRole("button", { name: /delete listing/i })
      ).toBeInTheDocument()

      rerender(<CreateListingForm />)

      expect(
        screen.queryByRole("button", { name: /delete listing/i })
      ).not.toBeInTheDocument()
    })

    it("opens delete confirmation dialog", async () => {
      const user = userEvent.setup()
      renderWithClient(<CreateListingForm listing={editListing} />)

      await user.click(
        screen.getByRole("button", { name: /delete listing/i })
      )

      expect(screen.getByRole("dialog")).toBeInTheDocument()
      expect(
        screen.getByText(/this action cannot be undone/i)
      ).toBeInTheDocument()
    })

    it("calls deleteListing and redirects on delete confirm", async () => {
      mockDeleteListing.mockResolvedValue({ success: true })

      const user = userEvent.setup()
      renderWithClient(<CreateListingForm listing={editListing} />)

      await user.click(
        screen.getByRole("button", { name: /delete listing/i })
      )
      await user.click(
        screen.getByRole("button", { name: /confirm/i })
      )

      await waitFor(() => {
        expect(mockDeleteListing).toHaveBeenCalledWith("edit-123")
        expect(mockSuccessToast).toHaveBeenCalled()
        expect(mockPush).toHaveBeenCalledWith("/listings")
      })
    })

    it("shows error toast when delete fails", async () => {
      mockDeleteListing.mockResolvedValue({
        success: false,
        error: "Cannot delete",
      })

      const user = userEvent.setup()
      renderWithClient(<CreateListingForm listing={editListing} />)

      await user.click(
        screen.getByRole("button", { name: /delete listing/i })
      )
      await user.click(
        screen.getByRole("button", { name: /confirm/i })
      )

      await waitFor(() => {
        expect(mockErrorToast).toHaveBeenCalledWith("Cannot delete")
      })
      expect(mockPush).not.toHaveBeenCalled()
    })

    it("closes delete dialog when Cancel is clicked", async () => {
      const user = userEvent.setup()
      renderWithClient(<CreateListingForm listing={editListing} />)

      await user.click(
        screen.getByRole("button", { name: /delete listing/i })
      )
      expect(screen.getByRole("dialog")).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: /cancel/i }))
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  describe("image upload", () => {
    it("renders an image picker area with a file input", () => {
      renderWithClient(<CreateListingForm />)

      const fileInput = screen.getByLabelText("Images")
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveAttribute("type", "file")
    })

    it("shows previews for selected files", async () => {
      const user = userEvent.setup()
      renderWithClient(<CreateListingForm />)

      const file = new File(["dummy"], "test-image.png", { type: "image/png" })
      const fileInput = screen.getByLabelText("Images") as HTMLInputElement

      await user.upload(fileInput, file)

      expect(screen.getByText("test-image.png")).toBeInTheDocument()
      // Should show a remove button per file
      expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument()
    })

    it("removes a file when the remove button is clicked", async () => {
      const user = userEvent.setup()
      renderWithClient(<CreateListingForm />)

      const file = new File(["dummy"], "test-image.png", { type: "image/png" })
      const fileInput = screen.getByLabelText("Images") as HTMLInputElement

      await user.upload(fileInput, file)
      expect(screen.getByText("test-image.png")).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: /remove/i }))
      expect(screen.queryByText("test-image.png")).not.toBeInTheDocument()
    })

    it("uploads images and includes URLs in the listing submission", { timeout: 15000 }, async () => {
      mockUploadImages.mockResolvedValue({
        success: true,
        urls: [
          "https://example.com/img1.jpg",
          "https://example.com/img2.jpg",
        ],
      })
      mockCreateListing.mockResolvedValue({
        success: true,
        listing: { id: "new-123" },
      })

      const user = userEvent.setup()
      renderWithClient(<CreateListingForm />)

      // Fill the form
      await user.type(screen.getByLabelText("Title"), "Test Watch")
      await user.type(screen.getByLabelText("Description"), "A nice watch")
      await user.type(screen.getByLabelText("Price"), "150")
      await user.selectOptions(screen.getByLabelText("Category"), "Electronics")
      await user.selectOptions(screen.getByLabelText("Condition"), "Good")

      // Upload two files
      const file1 = new File(["a"], "img1.jpg", { type: "image/jpeg" })
      const file2 = new File(["b"], "img2.jpg", { type: "image/jpeg" })
      const fileInput = screen.getByLabelText("Images") as HTMLInputElement

      await user.upload(fileInput, [file1, file2])

      // Submit
      await user.click(screen.getByRole("button", { name: /create listing/i }))

      await waitFor(() => {
        // Should upload images first
        expect(mockUploadImages).toHaveBeenCalled()
        // Then create listing with image URLs
        expect(mockCreateListing).toHaveBeenCalledWith(
          expect.objectContaining({
            images: [
              "https://example.com/img1.jpg",
              "https://example.com/img2.jpg",
            ],
          })
        )
      })
    })
  })
})
