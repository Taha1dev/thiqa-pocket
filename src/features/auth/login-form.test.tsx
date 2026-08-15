import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LoginForm } from "@/features/auth/login-form"
import "@/i18n/config"
import {
  demoCredentials,
  mockSessionToken,
} from "@/infrastructure/auth/mock-auth"

const sileoMocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}))

vi.mock("sileo", () => ({
  sileo: sileoMocks,
}))

describe("login form", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows localized validation and focuses the first invalid field", async () => {
    const user = userEvent.setup()

    render(<LoginForm onAuthenticated={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "Sign in securely" }))

    const email = screen.getByLabelText("Email address")
    expect(
      await screen.findByText("Enter your email address.")
    ).toBeInTheDocument()
    expect(screen.getByText("Enter your password.")).toBeInTheDocument()
    expect(email).toHaveFocus()
  })

  it("preserves the email and clears the password after incorrect credentials", async () => {
    const user = userEvent.setup()

    render(<LoginForm onAuthenticated={vi.fn()} />)

    const email = screen.getByLabelText("Email address")
    const password = screen.getByLabelText("Password")
    await user.type(email, demoCredentials.email)
    await user.type(password, "WrongPass1!")
    await user.click(screen.getByRole("button", { name: "Sign in securely" }))

    expect(
      await screen.findByText(/email or password is incorrect/i)
    ).toBeInTheDocument()
    expect(email).toHaveValue(demoCredentials.email)
    expect(password).toHaveValue("")
    expect(email).toHaveFocus()
    expect(sileoMocks.error).toHaveBeenCalledOnce()
  })

  it("returns the configured mock token for valid credentials", async () => {
    const user = userEvent.setup()
    const onAuthenticated = vi.fn()

    render(<LoginForm onAuthenticated={onAuthenticated} />)

    await user.type(
      screen.getByLabelText("Email address"),
      demoCredentials.email
    )
    await user.type(screen.getByLabelText("Password"), demoCredentials.password)
    await user.click(screen.getByRole("button", { name: "Sign in securely" }))

    await waitFor(() =>
      expect(onAuthenticated).toHaveBeenCalledWith(mockSessionToken)
    )
    expect(sileoMocks.success).toHaveBeenCalledOnce()
  })
})
