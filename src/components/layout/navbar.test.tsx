import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Navbar } from "@/components/layout/navbar"

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

const {
  mockPush,
  mockLogout,
  mockSetUser,
  mockSuccessToast,
  mockErrorToast,
  useAuthStoreMock,
  mockGetState,
} = vi.hoisted(() => {
  const mockGetState = vi.fn()
  const useAuthStoreMock = Object.assign(
    (selector?: (state: { user: { name: string } | null; setUser: (u: null) => void; isLoading: boolean }) => unknown) => {
      if (selector) {
        return selector({
          user: { name: "Test User" },
          setUser: mockSetUser,
          isLoading: false,
        })
      }
      return {
        user: { name: "Test User" },
        setUser: mockSetUser,
        isLoading: false,
      }
    },
    { getState: mockGetState }
  )
  return {
    mockPush: vi.fn(),
    mockLogout: vi.fn(),
    mockSetUser: vi.fn(),
    mockSuccessToast: vi.fn(),
    mockErrorToast: vi.fn(),
    useAuthStoreMock,
    mockGetState,
  }
})

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/actions/auth", () => ({
  logout: mockLogout,
}))

vi.mock("sonner", () => ({
  toast: { success: mockSuccessToast, error: mockErrorToast },
}))

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: useAuthStoreMock,
}))

describe("Navbar", () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockLogout.mockClear()
    mockSetUser.mockClear()
    mockSuccessToast.mockClear()
    mockErrorToast.mockClear()
    mockGetState.mockClear()
    mockGetState.mockReturnValue({ setUser: mockSetUser })
  })

  it("shows success toast on logout", async () => {
    const user = userEvent.setup()
    mockLogout.mockResolvedValue(undefined)

    renderWithClient(<Navbar />)

    // Open the mobile hamburger menu
    const menuButton = screen.getByRole("button", { name: /menu/i })
    await user.click(menuButton)
    await user.click(screen.getByText("Sign Out"))

    await waitFor(() => {
      expect(mockSuccessToast).toHaveBeenCalledWith("Signed out")
    })
  })
})
