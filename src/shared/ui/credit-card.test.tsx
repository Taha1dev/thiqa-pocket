import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import { createMoneyFromMinor } from "@/domain/money"
import i18n from "@/i18n/config"
import { CreditCard } from "@/shared/ui/credit-card"

const wallet = {
  id: "usr_1001",
  name: "Sara Al-Otaibi",
  balance: createMoneyFromMinor(428_550, "SAR"),
}

describe("CreditCard", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en")
  })

  it("renders wallet data with the existing white Thiqa mark", () => {
    const { container } = render(<CreditCard locale="en" wallet={wallet} />)

    expect(
      screen.getByRole("region", { name: "Available balance" })
    ).toHaveTextContent("4,285.50")
    expect(screen.getByText("Sara Al-Otaibi")).toBeVisible()
    expect(screen.getByText(/•••• 1001/)).toBeVisible()
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/thiqa-white-icon.svg"
    )
  })

  it("keeps the preview variant informational", () => {
    const { container } = render(
      <CreditCard locale="en" variant="preview" wallet={wallet} />
    )

    expect(container.querySelector('[data-variant="preview"]')).toBeTruthy()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    expect(screen.queryByText(/Mastercard|Visa|CVV/i)).not.toBeInTheDocument()
  })

  it("uses the gold SIM and luminous-line composition without a card grid", () => {
    const { container } = render(<CreditCard locale="en" wallet={wallet} />)
    const card = container.querySelector<HTMLElement>('[data-variant="live"]')

    expect(card).not.toBeNull()
    expect(card?.querySelector(".wallet-sim-glass")).toBeInTheDocument()
    expect(card?.querySelectorAll("[data-wallet-lines] path")).toHaveLength(3)
    expect(card?.querySelector(".grid")).not.toBeInTheDocument()
  })

  it("tracks pointer tilt and resets to its resting position", () => {
    const { container } = render(<CreditCard locale="en" wallet={wallet} />)
    const card = container.querySelector<HTMLElement>('[data-variant="live"]')
    if (!card) {
      throw new Error("Expected the wallet card to render.")
    }

    card.getBoundingClientRect = () =>
      ({
        bottom: 400,
        height: 400,
        left: 0,
        right: 800,
        top: 0,
        width: 800,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect

    fireEvent.pointerMove(card, {
      clientX: 700,
      clientY: 80,
      pointerType: "mouse",
    })
    expect(card).toHaveAttribute("data-tilting", "true")
    expect(card.style.getPropertyValue("--wallet-tilt-x")).not.toBe("0deg")
    expect(card.style.getPropertyValue("--wallet-tilt-y")).not.toBe("0deg")

    fireEvent.pointerLeave(card, { pointerType: "mouse" })
    expect(card).toHaveAttribute("data-tilting", "false")
    expect(card.style.getPropertyValue("--wallet-tilt-x")).toBe("0deg")
    expect(card.style.getPropertyValue("--wallet-tilt-y")).toBe("0deg")
  })
})
