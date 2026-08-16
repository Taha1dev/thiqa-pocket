import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import i18n from "@/i18n/config"
import { RoutePending } from "@/shared/ui/route-pending"

describe("route pending UI", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en")
  })

  it("uses visible skeletons while retaining loading text only for screen readers", () => {
    const { container } = render(<RoutePending />)

    expect(
      container.querySelectorAll('[data-slot="skeleton"]')
    ).not.toHaveLength(0)
    expect(screen.getByRole("status")).toHaveTextContent("Loading…")
    expect(screen.getByRole("status")).toHaveClass("sr-only")
  })
})
