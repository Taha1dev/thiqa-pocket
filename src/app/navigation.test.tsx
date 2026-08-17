import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AppAccountMenu } from "@/shared/ui/account-menu"
import { DesktopNavigation, MobileNavigation } from "@/shared/ui/navigation"
import { createMoney } from "@/domain/money"
import type { WalletUser } from "@/domain/wallet"
import "@/i18n/config"
import { useAuthStore } from "@/features/auth/store"

const sileoMocks = vi.hoisted(() => ({ info: vi.fn() }))

vi.mock("sileo", () => ({ sileo: sileoMocks }))

const wallet: WalletUser = {
  id: "usr_1001",
  name: "Sara Al-Otaibi",
  phone: "+966501234567",
  balance: createMoney(4285.5, "SAR"),
}

describe("authenticated app navigation", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: "session", hasHydrated: true })
    vi.clearAllMocks()
  })

  it("exposes desktop destinations and identifies the active route", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <DesktopNavigation />
      </MemoryRouter>
    )

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(screen.getByRole("link", { name: "Send" })).toHaveAttribute(
      "href",
      "/transfer"
    )
    expect(screen.getByRole("link", { name: "Ask Thiqa" })).toHaveAttribute(
      "href",
      "/assistant"
    )
  })

  it("provides the four mobile destinations", () => {
    render(
      <MemoryRouter initialEntries={["/top-up"]}>
        <MobileNavigation />
      </MemoryRouter>
    )

    expect(screen.getAllByRole("link")).toHaveLength(4)
    expect(screen.getByRole("link", { name: "Top up" })).toHaveAttribute(
      "aria-current",
      "page"
    )
  })

  it("logs out from the account popover", async () => {
    const user = userEvent.setup()

    render(<AppAccountMenu user={wallet} />)

    await user.click(screen.getByRole("button", { name: "Open account menu" }))
    await user.click(await screen.findByRole("button", { name: "Log out" }))

    expect(useAuthStore.getState().token).toBeNull()
    expect(sileoMocks.info).toHaveBeenCalledOnce()
  })
})
