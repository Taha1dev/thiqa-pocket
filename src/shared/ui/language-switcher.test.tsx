import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"

import i18n from "@/i18n/config"
import { LanguageSwitcher } from "@/shared/ui/language-switcher"

describe("LanguageSwitcher", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en")
  })

  it("supports arrow-key navigation and preserves root language direction", async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    await user.click(screen.getByRole("button", { name: "Change language" }))
    const english = await screen.findByRole("menuitemradio", {
      name: "English",
    })
    const arabic = screen.getByRole("menuitemradio", { name: "العربية" })

    english.focus()
    await user.keyboard("{ArrowUp}")
    expect(arabic).toHaveFocus()
    await user.keyboard("{Enter}")

    expect(document.documentElement).toHaveAttribute("lang", "ar")
    expect(document.documentElement).toHaveAttribute("dir", "rtl")
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })
})
