import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import i18n from "@/i18n/config"
import { OnlineStatus } from "@/shared/ui/online-status"

let isOnline = true

describe("OnlineStatus", () => {
  beforeEach(async () => {
    isOnline = true
    vi.spyOn(window.navigator, "onLine", "get").mockImplementation(
      () => isOnline
    )
    await i18n.changeLanguage("en")
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("shows an accessible warning only while the browser is offline", () => {
    render(<OnlineStatus />)

    expect(screen.queryByRole("status")).not.toBeInTheDocument()

    act(() => {
      isOnline = false
      window.dispatchEvent(new Event("offline"))
    })

    expect(screen.getByRole("status")).toHaveTextContent(
      "Wallet data and the assistant may be unavailable"
    )

    act(() => {
      isOnline = true
      window.dispatchEvent(new Event("online"))
    })

    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("removes its connection listeners when unmounted", () => {
    const removeEventListener = vi.spyOn(window, "removeEventListener")
    const { unmount } = render(<OnlineStatus />)

    unmount()

    expect(removeEventListener).toHaveBeenCalledWith(
      "online",
      expect.any(Function)
    )
    expect(removeEventListener).toHaveBeenCalledWith(
      "offline",
      expect.any(Function)
    )
  })
})
