import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAction } from "./use-action"

const { mockSuccessToast, mockErrorToast } = vi.hoisted(() => ({
  mockSuccessToast: vi.fn(),
  mockErrorToast: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: { success: mockSuccessToast, error: mockErrorToast },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
  return Wrapper
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useAction", () => {
  describe("with success-result API (has .success field)", () => {
    it("calls toast.success and invalidates query keys on success", async () => {
      const mutationFn = vi.fn().mockResolvedValue({ success: true, data: "ok" })
      const onSuccess = vi.fn()

      const { result } = renderHook(
        () =>
          useAction(mutationFn, {
            successMessage: "Done!",
            invalidateKeys: [["listings"]],
            onSuccess,
          }),
        { wrapper: createWrapper() },
      )

      await act(async () => {
        result.current.mutate(undefined as void)
      })

      await waitFor(() => {
        expect(mockSuccessToast).toHaveBeenCalledWith("Done!")
      })
      expect(onSuccess).toHaveBeenCalled()
      expect(mockErrorToast).not.toHaveBeenCalled()
    })

    it("calls toast.error when result.success is false", async () => {
      const mutationFn = vi.fn().mockResolvedValue({
        success: false,
        error: "Something broke",
      })

      const { result } = renderHook(
        () =>
          useAction(mutationFn, {
            successMessage: "Done!",
          }),
        { wrapper: createWrapper() },
      )

      await act(async () => {
        result.current.mutate(undefined as void)
      })

      await waitFor(() => {
        expect(mockErrorToast).toHaveBeenCalledWith("Something broke")
      })
      expect(mockSuccessToast).not.toHaveBeenCalled()
    })
  })

  describe("with void-return API (no .success field)", () => {
    it("calls toast.success and onSuccess without checking result", async () => {
      const mutationFn = vi.fn().mockResolvedValue(undefined)
      const onSuccess = vi.fn()

      const { result } = renderHook(
        () =>
          useAction(mutationFn, {
            successMessage: "Signed out",
            onSuccess,
          }),
        { wrapper: createWrapper() },
      )

      await act(async () => {
        result.current.mutate(undefined as void)
      })

      await waitFor(() => {
        expect(mockSuccessToast).toHaveBeenCalledWith("Signed out")
      })
      expect(onSuccess).toHaveBeenCalled()
      expect(mockErrorToast).not.toHaveBeenCalled()
    })
  })

  it("calls both toast.error and onError on business error", async () => {
    const mutationFn = vi.fn().mockResolvedValue({
      success: false,
      error: "Bad request",
    })
    const onError = vi.fn()

    const { result } = renderHook(
      () =>
        useAction(mutationFn, {
          successMessage: "Done!",
          onError,
        }),
      { wrapper: createWrapper() },
    )

    await act(async () => {
      result.current.mutate(undefined as void)
    })

    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalledWith("Bad request")
      expect(onError).toHaveBeenCalledWith("Bad request")
    })
  })

  it("calls both toast.error and onError on unexpected exception", async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error("Network error"))
    const onError = vi.fn()

    const { result } = renderHook(
      () =>
        useAction(mutationFn, {
          successMessage: "Done!",
          onError,
        }),
      { wrapper: createWrapper() },
    )

    await act(async () => {
      result.current.mutate(undefined as void)
    })

    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalledWith("Network error")
      expect(onError).toHaveBeenCalledWith("Network error")
    })
  })

  it("calls onSettled after mutation completes", async () => {
    const mutationFn = vi.fn().mockResolvedValue({ success: true })
    const onSettled = vi.fn()

    const { result } = renderHook(
      () =>
        useAction(mutationFn, {
          successMessage: "Done!",
          onSettled,
        }),
      { wrapper: createWrapper() },
    )

    await act(async () => {
      result.current.mutate(undefined as void)
    })

    await waitFor(() => {
      expect(onSettled).toHaveBeenCalled()
    })
  })

  it("calls toast.error on unexpected exceptions", async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error("Network error"))

    const { result } = renderHook(
      () =>
        useAction(mutationFn, {
          successMessage: "Done!",
        }),
      { wrapper: createWrapper() },
    )

    await act(async () => {
      result.current.mutate(undefined as void)
    })

    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalledWith("Network error")
    })
  })

  it("returns isPending from useMutation", () => {
    const mutationFn = vi.fn().mockResolvedValue({ success: true })

    const { result } = renderHook(
      () =>
        useAction(mutationFn, {
          successMessage: "Done!",
        }),
      { wrapper: createWrapper() },
    )

    expect(result.current.isPending).toBe(false)
  })
})
