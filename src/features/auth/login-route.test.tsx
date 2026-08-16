import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ThemeProvider } from "@/components/theme-provider"
import { Component as LoginRoute } from "@/features/auth/login-route"
import i18n from "@/i18n/config"
import { useAuthStore } from "@/infrastructure/auth/auth-store"
import { walletRepository } from "@/infrastructure/wallet/json-wallet-repository"

describe("LoginRoute", () => {
  beforeEach(async () => {
    useAuthStore.setState({ token: null, hasHydrated: true })
    await i18n.changeLanguage("en")
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders the static wallet preview without requesting private wallet data", () => {
    const getWallet = vi.spyOn(walletRepository, "getWallet")

    render(
      <ThemeProvider defaultTheme="light">
        <MemoryRouter initialEntries={["/login"]}>
          <LoginRoute />
        </MemoryRouter>
      </ThemeProvider>
    )

    expect(
      screen.getByRole("region", { name: "Available balance" })
    ).toHaveTextContent("4,285.50")
    expect(screen.getByText("Your Name")).toBeVisible()
    expect(screen.queryByText("Sara Al-Otaibi")).not.toBeInTheDocument()
    expect(getWallet).not.toHaveBeenCalled()
  })
})
