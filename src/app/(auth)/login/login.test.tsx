import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import LoginPage from "@/app/(auth)/login/page"

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

const { mockPush, mockLogin, mockSetUser, mockSuccessToast, mockErrorToast } =
  vi.hoisted(() => ({
    mockPush: vi.fn(),
    mockLogin: vi.fn(),
    mockSetUser: vi.fn(),
    mockSuccessToast: vi.fn(),
    mockErrorToast: vi.fn(),
  }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/lib/api/actions", () => ({
  login: mockLogin,
}))

vi.mock("sonner", () => ({
  toast: { success: mockSuccessToast, error: mockErrorToast },
}))

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: (selector?: (state: unknown) => unknown) => {
    if (selector) {
      return selector({ user: null, setUser: mockSetUser, ready: true })
    }
    return { user: null, setUser: mockSetUser, ready: true }
  },
}))

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup()
  renderWithClient(<LoginPage />)

  await user.type(screen.getByLabelText("Email"), email)
  await user.type(screen.getByLabelText("Password"), password)
  await user.click(screen.getByRole("button", { name: /sign in/i }))
}

describe("LoginPage", () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockLogin.mockClear()
    mockSetUser.mockClear()
    mockSuccessToast.mockClear()
    mockErrorToast.mockClear()
  })

  it("shows inline error on email field when server returns email-related error", async () => {
    mockLogin.mockResolvedValue({ success: false, error: "Invalid email or password" })

    await fillAndSubmit("test@example.com", "password123")

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument()
    })
  })

  it("still shows error toast on server failure", async () => {
    mockLogin.mockResolvedValue({ success: false, error: "Invalid email or password" })

    await fillAndSubmit("test@example.com", "password123")

    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalledWith("Invalid email or password")
    })
  })
})
