import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import i18n from "@/i18n/config"
import { RoutePending } from "@/shared/ui/route-pending"

describe("route pending UI", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en")
  })

  it("shows a branded spinner while retaining loading text for screen readers", () => {
    const { container } = render(<RoutePending />)

    expect(
      container.querySelector('[data-slot="route-pending-spinner"]')
    ).toBeInTheDocument()
    expect(container.querySelector('img[src="/favicon.svg"]')).toBeVisible()
    expect(screen.getByRole("status")).toHaveTextContent("Loading…")
    expect(screen.getByRole("status")).toHaveClass("sr-only")
  })
})
