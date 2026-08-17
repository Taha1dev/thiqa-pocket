import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LoginForm } from "@/features/auth/login-form"
import i18n from "@/i18n/config"
import {
  authenticateMockCredentials,
  demoCredentials,
  mockSessionToken,
} from "@/features/auth/mock-auth"

const sileoMocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}))

vi.mock("sileo", () => ({
  sileo: sileoMocks,
}))

describe("login form", () => {
  const authenticateImmediately = (
    credentials: Parameters<typeof authenticateMockCredentials>[0]
  ) => authenticateMockCredentials(credentials, { delayMs: 0 })

  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage("en")
  })

  it("keeps email LTR while allowing localized password direction", async () => {
    await i18n.changeLanguage("ar")
    render(
      <LoginForm
        authenticate={authenticateImmediately}
        onAuthenticated={vi.fn()}
      />
    )

    expect(document.getElementById("login-email")).toHaveAttribute("dir", "ltr")
    expect(document.getElementById("login-password")).toHaveAttribute(
      "dir",
      "auto"
    )
    expect(document.getElementById("login-password")).toHaveClass(
      "localized-placeholder-direction"
    )
  })

  it("shows localized validation and focuses the first invalid field", async () => {
    const user = userEvent.setup()

    render(
      <LoginForm
        authenticate={authenticateImmediately}
        onAuthenticated={vi.fn()}
      />
    )

    const email = screen.getByLabelText("Email address")
    const password = screen.getByLabelText("Password")
    await user.clear(email)
    await user.clear(password)
    await user.click(screen.getByRole("button", { name: "Sign in securely" }))

    expect(
      await screen.findByText("Enter your email address.")
    ).toBeInTheDocument()
    expect(screen.getByText("Enter your password.")).toBeInTheDocument()
    expect(email).toHaveFocus()
  })

  it("preserves the email and resets the password after incorrect credentials", async () => {
    const user = userEvent.setup()

    render(
      <LoginForm
        authenticate={authenticateImmediately}
        onAuthenticated={vi.fn()}
      />
    )

    const email = screen.getByLabelText("Email address")
    const password = screen.getByLabelText("Password")
    await user.clear(email)
    await user.clear(password)
    await user.type(email, demoCredentials.email)
    await user.type(password, "WrongPass1!")
    await user.click(screen.getByRole("button", { name: "Sign in securely" }))

    expect(
      await screen.findByText(/email or password is incorrect/i)
    ).toBeInTheDocument()
    expect(email).toHaveValue(demoCredentials.email)
    expect(password).toHaveValue(demoCredentials.password)
    expect(email).toHaveFocus()
    expect(sileoMocks.error).toHaveBeenCalledOnce()
  })

  it("returns the configured mock token for valid credentials", async () => {
    const user = userEvent.setup()
    const onAuthenticated = vi.fn()

    render(
      <LoginForm
        authenticate={authenticateImmediately}
        onAuthenticated={onAuthenticated}
      />
    )

    const email = screen.getByLabelText("Email address")
    const password = screen.getByLabelText("Password")
    await user.clear(email)
    await user.clear(password)
    await user.type(email, demoCredentials.email)
    await user.type(password, demoCredentials.password)
    await user.click(screen.getByRole("button", { name: "Sign in securely" }))

    await waitFor(() =>
      expect(onAuthenticated).toHaveBeenCalledWith(mockSessionToken)
    )
    expect(sileoMocks.success).toHaveBeenCalledOnce()
  })

  it("reports an unexpected authentication failure without leaking the error", async () => {
    const user = userEvent.setup()
    const authenticate = vi.fn().mockRejectedValue(new Error("private detail"))
    const onAuthenticated = vi.fn()

    render(
      <LoginForm
        authenticate={authenticate}
        onAuthenticated={onAuthenticated}
      />
    )

    const email = screen.getByLabelText("Email address")
    const password = screen.getByLabelText("Password")
    await user.clear(email)
    await user.clear(password)
    await user.type(email, demoCredentials.email)
    await user.type(password, demoCredentials.password)
    await user.click(screen.getByRole("button", { name: "Sign in securely" }))

    expect(
      await screen.findByText(/could not complete sign-in/i)
    ).toBeInTheDocument()
    expect(screen.queryByText(/private detail/i)).not.toBeInTheDocument()
    expect(onAuthenticated).not.toHaveBeenCalled()
    expect(sileoMocks.error).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Sign-in unavailable" })
    )
  })

  it("shows an immediate pending control while authentication is unresolved", async () => {
    const user = userEvent.setup()
    let resolveAuthentication!: (token: string | null) => void
    const authenticate = vi.fn(
      () =>
        new Promise<string | null>((resolve) => {
          resolveAuthentication = resolve
        })
    )
    const onAuthenticated = vi.fn()

    render(
      <LoginForm
        authenticate={authenticate}
        onAuthenticated={onAuthenticated}
      />
    )

    const email = screen.getByLabelText("Email address")
    const password = screen.getByLabelText("Password")
    await user.clear(email)
    await user.clear(password)
    await user.type(email, demoCredentials.email)
    await user.type(password, demoCredentials.password)
    await user.click(screen.getByRole("button", { name: "Sign in securely" }))

    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled()
    expect(onAuthenticated).not.toHaveBeenCalled()

    resolveAuthentication(mockSessionToken)

    await waitFor(() =>
      expect(onAuthenticated).toHaveBeenCalledWith(mockSessionToken)
    )
  })
})
