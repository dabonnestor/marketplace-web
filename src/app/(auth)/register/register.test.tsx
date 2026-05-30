import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import RegisterPage from "@/app/(auth)/register/page"

const { mockPush, mockRegister, mockSetUser, mockSuccessToast, mockErrorToast } =
  vi.hoisted(() => ({
    mockPush: vi.fn(),
    mockRegister: vi.fn(),
    mockSetUser: vi.fn(),
    mockSuccessToast: vi.fn(),
    mockErrorToast: vi.fn(),
  }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/actions/auth", () => ({
  register: mockRegister,
}))

vi.mock("sonner", () => ({
  toast: { success: mockSuccessToast, error: mockErrorToast },
}))

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: (selector?: (state: unknown) => unknown) => {
    if (selector) {
      return selector({ user: null, setUser: mockSetUser, isLoading: false })
    }
    return { user: null, setUser: mockSetUser, isLoading: false }
  },
}))

async function fillAndSubmit() {
  const user = userEvent.setup()
  render(<RegisterPage />)

  await user.type(screen.getByLabelText("Name"), "Test User")
  await user.type(screen.getByLabelText("Email"), "test@example.com")
  await user.type(screen.getByLabelText(/^Password$/), "password123")
  await user.type(screen.getByLabelText("Confirm Password"), "password123")
  await user.click(screen.getByRole("button", { name: /create account/i }))
}

describe("RegisterPage", () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockRegister.mockClear()
    mockSetUser.mockClear()
    mockSuccessToast.mockClear()
    mockErrorToast.mockClear()
  })

  it("maps email-related server error to email field", async () => {
    mockRegister.mockResolvedValue({ success: false, error: "Email already registered" })

    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText("Email already registered")).toBeInTheDocument()
    })
  })

  it("maps password-related server error to password field", async () => {
    mockRegister.mockResolvedValue({ success: false, error: "Password is too weak" })

    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText("Password is too weak")).toBeInTheDocument()
    })
  })

  it("shows error toast on server failure", async () => {
    mockRegister.mockResolvedValue({ success: false, error: "Email already registered" })

    await fillAndSubmit()

    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalled()
    })
  })
})
