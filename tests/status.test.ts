import { describe, expect, it } from "bun:test"
import { formatMoney } from "../src/status"

describe("formatMoney", () => {
  it("formats positive amount", () => {
    expect(formatMoney(12.5)).toBe("$12.50")
  })

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("$0.00")
  })

  it("formats negative amount", () => {
    expect(formatMoney(-5.25)).toBe("-$5.25")
  })

  it("formats large amount", () => {
    expect(formatMoney(1234.56)).toBe("$1234.56")
  })
})
