import { afterEach, describe, expect, it } from "bun:test"
import { getStepFunAccount } from "../src/api"

function mockModelRegistry(apiKey: string | undefined) {
  return {
    getApiKeyForProvider: async () => apiKey,
  }
}

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

type FetchMock = ((input: string | URL | Request, init?: RequestInit) => Promise<Response>) & {
  preconnect?: (url: string | URL) => void
}

function createMockFetch(
  fn: (input: string | URL | Request, init?: RequestInit) => Promise<Response>,
): FetchMock {
  const mockFn = fn as FetchMock
  mockFn.preconnect = () => {}
  return mockFn
}

describe("getStepFunAccount", () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it("throws on missing API key", async () => {
    const registry = mockModelRegistry(undefined)
    await expect(getStepFunAccount(registry)).rejects.toThrow("Missing StepFun API credentials")
  })

  it("throws on empty API key", async () => {
    const registry = mockModelRegistry("")
    await expect(getStepFunAccount(registry)).rejects.toThrow("Missing StepFun API credentials")
  })

  it("throws on 401 response", async () => {
    globalThis.fetch = createMockFetch(async () => mockResponse({ error: "unauthorized" }, 401))
    const registry = mockModelRegistry("test-key")
    await expect(getStepFunAccount(registry)).rejects.toThrow("API request failed with status 401")
  })

  it("throws on 500 response", async () => {
    globalThis.fetch = createMockFetch(async () => mockResponse({ error: "internal" }, 500))
    const registry = mockModelRegistry("test-key")
    await expect(getStepFunAccount(registry)).rejects.toThrow("API request failed with status 500")
  })

  it("returns mapped camelCase data for valid prepaid response", async () => {
    globalThis.fetch = createMockFetch(async () =>
      mockResponse({
        object: "account",
        type: "prepaid",
        balance: 12.5,
        total_cash_balance: 25.0,
        total_voucher_balance: 26.0,
      }),
    )

    const registry = mockModelRegistry("test-key")
    const result = await getStepFunAccount(registry)

    expect(result).toEqual({
      type: "prepaid",
      balance: 12.5,
      totalCashBalance: 25.0,
      totalVoucherBalance: 26.0,
    })
  })

  it("handles postpaid type", async () => {
    globalThis.fetch = createMockFetch(async () =>
      mockResponse({
        object: "account",
        type: "postpaid",
        balance: 0,
        total_cash_balance: 0,
        total_voucher_balance: 0,
      }),
    )

    const registry = mockModelRegistry("test-key")
    const result = await getStepFunAccount(registry)

    expect(result.type).toBe("postpaid")
  })

  it("handles zero balances", async () => {
    globalThis.fetch = createMockFetch(async () =>
      mockResponse({
        object: "account",
        type: "prepaid",
        balance: 0,
        total_cash_balance: 0,
        total_voucher_balance: 0,
      }),
    )

    const registry = mockModelRegistry("test-key")
    const result = await getStepFunAccount(registry)

    expect(result.balance).toBe(0)
    expect(result.totalCashBalance).toBe(0)
    expect(result.totalVoucherBalance).toBe(0)
  })

  it("calls correct endpoint", async () => {
    let calledUrl = ""
    globalThis.fetch = createMockFetch(async (input) => {
      calledUrl = input.toString()
      return mockResponse({
        object: "account",
        type: "prepaid",
        balance: 1,
        total_cash_balance: 2,
        total_voucher_balance: 3,
      })
    })

    const registry = mockModelRegistry("test-key")
    await getStepFunAccount(registry)

    expect(calledUrl).toBe("https://api.stepfun.ai/v1/accounts")
  })

  it("sends correct auth header", async () => {
    let authHeader = ""
    globalThis.fetch = createMockFetch(async (_input, init) => {
      authHeader = (init?.headers as Record<string, string>).Authorization ?? ""
      return mockResponse({
        object: "account",
        type: "prepaid",
        balance: 1,
        total_cash_balance: 2,
        total_voucher_balance: 3,
      })
    })

    const registry = mockModelRegistry("my-secret-key")
    await getStepFunAccount(registry)

    expect(authHeader).toBe("Bearer my-secret-key")
  })
})
