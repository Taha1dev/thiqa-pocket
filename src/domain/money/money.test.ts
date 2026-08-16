import { describe, expect, it } from "vitest"

import { parseMoneyInputToMinor } from "@/domain/money/money"

describe("parseMoneyInputToMinor", () => {
  it("parses decimal text directly into integer minor units", () => {
    expect(parseMoneyInputToMinor("0.29")).toBe(29)
    expect(parseMoneyInputToMinor("4285.50")).toBe(428_550)
    expect(parseMoneyInputToMinor("1000")).toBe(100_000)
  })

  it("rejects unsupported precision and numeric syntax", () => {
    expect(parseMoneyInputToMinor("1.234")).toBeNull()
    expect(parseMoneyInputToMinor("1e3")).toBeNull()
    expect(parseMoneyInputToMinor("-5")).toBeNull()
  })
})
