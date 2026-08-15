import { describe, expect, it } from "vitest"

import { cn } from "@/lib/utils"

describe("source alias", () => {
  it("resolves @ imports", () => {
    expect(cn("block", undefined)).toBe("block")
  })
})
