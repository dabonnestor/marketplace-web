import React, { createContext, useContext, type ReactNode } from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CreateListingForm } from "@/components/listings/create-listing-form"

const { mockPush, mockCreateListing, mockSuccessToast, mockErrorToast, mockUploadImages } =
  vi.hoisted(() => ({
    mockPush: vi.fn(),
    mockCreateListing: vi.fn(),
    mockSuccessToast: vi.fn(),
    mockErrorToast: vi.fn(),
    mockUploadImages: vi.fn(),
  }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/actions/listings", () => ({
  createListing: mockCreateListing,
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
  render(<CreateListingForm />)

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
    mockSuccessToast.mockClear()
    mockErrorToast.mockClear()
    mockUploadImages.mockClear()
  })

  it("renders all required fields", () => {
    render(<CreateListingForm />)

    expect(screen.getByLabelText("Title")).toBeInTheDocument()
    expect(screen.getByLabelText("Description")).toBeInTheDocument()
    expect(screen.getByLabelText("Price")).toBeInTheDocument()
    expect(screen.getByLabelText("Category")).toBeInTheDocument()
    expect(screen.getByLabelText("Condition")).toBeInTheDocument()

    expect(screen.getByRole("button", { name: /create listing/i })).toBeInTheDocument()
  })

  it("shows validation errors when submitted empty", async () => {
    const user = userEvent.setup()
    render(<CreateListingForm />)

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
    render(<CreateListingForm />)

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

  describe("image upload", () => {
    it("renders an image picker area with a file input", () => {
      render(<CreateListingForm />)

      const fileInput = screen.getByLabelText("Images")
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveAttribute("type", "file")
    })

    it("shows previews for selected files", async () => {
      const user = userEvent.setup()
      render(<CreateListingForm />)

      const file = new File(["dummy"], "test-image.png", { type: "image/png" })
      const fileInput = screen.getByLabelText("Images") as HTMLInputElement

      await user.upload(fileInput, file)

      expect(screen.getByText("test-image.png")).toBeInTheDocument()
      // Should show a remove button per file
      expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument()
    })

    it("removes a file when the remove button is clicked", async () => {
      const user = userEvent.setup()
      render(<CreateListingForm />)

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
      render(<CreateListingForm />)

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
