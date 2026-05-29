import { describe, expect, it, mock } from "bun:test"
import type { StepFunAccountData } from "../src/api"
import {
  formatMoney,
  isCurrentModelStepFun,
  isStepFunProvider,
  StepFunBalanceCache,
} from "../src/status"

function mockCtx(provider?: string) {
  return {
    model: provider ? { provider } : undefined,
    modelRegistry: {
      getApiKeyForProvider: async () => "test-key",
    },
    ui: {
      theme: {
        fg: (style: string, text: string) => `[${style}]${text}[/${style}]`,
      },
      setStatus: mock(() => {}),
    },
  } as any
}

const sampleAccount: StepFunAccountData = {
  type: "prepaid",
  balance: 12.5,
  totalCashBalance: 25.0,
  totalVoucherBalance: 26.0,
}

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

describe("isStepFunProvider", () => {
  it("matches stepfun", () => {
    expect(isStepFunProvider("stepfun")).toBe(true)
  })

  it("matches case-insensitively", () => {
    expect(isStepFunProvider("STEPFUN")).toBe(true)
  })

  it("matches stepfun prefix", () => {
    expect(isStepFunProvider("stepfun-extra")).toBe(true)
  })

  it("does not match other providers", () => {
    expect(isStepFunProvider("openai")).toBe(false)
  })

  it("returns false for undefined", () => {
    expect(isStepFunProvider(undefined)).toBe(false)
  })
})

describe("isCurrentModelStepFun", () => {
  it("returns true for stepfun provider", () => {
    expect(isCurrentModelStepFun(mockCtx("stepfun"))).toBe(true)
  })

  it("returns false for other providers", () => {
    expect(isCurrentModelStepFun(mockCtx("openai"))).toBe(false)
  })

  it("returns false when no model", () => {
    expect(isCurrentModelStepFun(mockCtx())).toBe(false)
  })
})

describe("StepFunBalanceCache", () => {
  it("sets status on fetch", async () => {
    const cache = new StepFunBalanceCache()
    const ctx = mockCtx("stepfun")

    const fetchFn = mock(() => Promise.resolve(sampleAccount))
    await cache.updateStatus(ctx, fetchFn as any)

    expect(fetchFn).toHaveBeenCalled()
    expect(ctx.ui.setStatus).toHaveBeenCalledWith(
      "stepfun-usage",
      "[muted]StepFun:[/muted][accent] $12.50[/accent]",
    )
  })

  it("uses cached data within cooldown", async () => {
    const cache = new StepFunBalanceCache()
    const ctx = mockCtx("stepfun")

    const fetchFn = mock(() => Promise.resolve(sampleAccount))

    // First call — fetches
    await cache.updateStatus(ctx, fetchFn as any)
    expect(fetchFn).toHaveBeenCalledTimes(1)

    // Second call — uses cache
    await cache.updateStatus(ctx, fetchFn as any)
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it("clears status on error", async () => {
    const cache = new StepFunBalanceCache()
    const ctx = mockCtx("stepfun")

    const fetchFn = mock(() => Promise.reject(new Error("API error")))
    await cache.updateStatus(ctx, fetchFn as any)

    expect(ctx.ui.setStatus).toHaveBeenCalledWith("stepfun-usage", undefined)
  })

  it("logs error to console", async () => {
    const cache = new StepFunBalanceCache()
    const ctx = mockCtx("stepfun")
    const consoleError = mock(() => {})
    const original = console.error
    console.error = consoleError

    const fetchFn = mock(() => Promise.reject(new Error("API error")))
    await cache.updateStatus(ctx, fetchFn as any)

    expect(consoleError).toHaveBeenCalled()
    console.error = original
  })

  it("clear removes footer status", () => {
    const cache = new StepFunBalanceCache()
    const ctx = mockCtx("stepfun")

    cache.clear(ctx)
    expect(ctx.ui.setStatus).toHaveBeenCalledWith("stepfun-usage", undefined)
  })
})
