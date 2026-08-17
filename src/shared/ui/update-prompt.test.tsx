import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import i18n from "@/i18n/config"
import { UpdatePrompt } from "@/shared/ui/update-prompt"

const registerSwMock = vi.hoisted(() => ({
  needRefresh: false,
  setNeedRefresh: vi.fn(),
  updateServiceWorker: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [registerSwMock.needRefresh, registerSwMock.setNeedRefresh],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: registerSwMock.updateServiceWorker,
  }),
}))

describe("UpdatePrompt", () => {
  beforeEach(async () => {
    registerSwMock.needRefresh = false
    registerSwMock.setNeedRefresh.mockReset()
    registerSwMock.updateServiceWorker.mockReset().mockResolvedValue(undefined)
    await i18n.changeLanguage("en")
  })

  it("stays hidden when no updated service worker is waiting", () => {
    render(<UpdatePrompt />)

    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("activates the waiting service worker only after explicit confirmation", async () => {
    const user = userEvent.setup()
    registerSwMock.needRefresh = true
    render(<UpdatePrompt />)

    expect(screen.getByRole("status")).toHaveTextContent(
      "A new Thiqa Pocket version is ready."
    )

    await user.click(screen.getByRole("button", { name: "Update now" }))

    expect(registerSwMock.updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it("dismisses the current update prompt when Later is selected", async () => {
    const user = userEvent.setup()
    registerSwMock.needRefresh = true
    const view = render(<UpdatePrompt />)

    await user.click(screen.getByRole("button", { name: "Later" }))

    expect(registerSwMock.setNeedRefresh).toHaveBeenCalledWith(false)

    registerSwMock.needRefresh = false
    view.rerender(<UpdatePrompt />)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })
})
