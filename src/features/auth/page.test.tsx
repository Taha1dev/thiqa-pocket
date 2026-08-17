import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ThemeProvider } from "@/components/theme-provider"
import { LoginPage } from "@/features/auth/page"
import i18n from "@/i18n/config"
import { walletRepository } from "@/data/wallet-repository"
import { useAuthStore } from "@/features/auth/store"

describe("LoginRoute", () => {
  beforeEach(async () => {
    useAuthStore.setState({ token: null, hasHydrated: true })
    await i18n.changeLanguage("en")
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders the static wallet preview without requesting private wallet data", () => {
    const getWalletData = vi.spyOn(walletRepository, "getWalletData")

    render(
      <ThemeProvider defaultTheme="light">
        <MemoryRouter initialEntries={["/login"]}>
          <LoginPage />
        </MemoryRouter>
      </ThemeProvider>
    )

    expect(
      screen.getByRole("region", { name: "Available balance" })
    ).toHaveTextContent("4,285.50")
    expect(screen.getByText("Your Name")).toBeVisible()
    expect(screen.queryByText("Sara Al-Otaibi")).not.toBeInTheDocument()
    expect(getWalletData).not.toHaveBeenCalled()
  })
})
