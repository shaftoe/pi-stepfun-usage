/**
 * StepFun Usage Checker - Pi Extension
 * API interaction functions
 */

import type { ModelRegistry } from "@earendil-works/pi-coding-agent"

const STEPFUN_ACCOUNT_API_URL = "https://api.stepfun.ai/v1/accounts/get"

interface StepFunAccountResponse {
  object: "account"
  type: "prepaid" | "postpaid"
  balance: number
  total_cash_balance: number
  total_voucher_balance: number
}

export interface StepFunAccountData {
  type: "prepaid" | "postpaid"
  balance: number // current available
  totalCashBalance: number // total deposited
  totalVoucherBalance: number // promotional credits
}

/**
 * Fetch StepFun account balance from the API
 */
export async function getStepFunAccount(
  modelRegistry: Pick<ModelRegistry, "getApiKeyForProvider">,
): Promise<StepFunAccountData> {
  const apiKey = await modelRegistry.getApiKeyForProvider("stepfun")
  if (!apiKey) {
    throw new Error(
      "Missing StepFun API credentials. Set STEP_API_KEY or configure the stepfun provider.",
    )
  }

  const response = await fetch(STEPFUN_ACCOUNT_API_URL, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  const data = (await response.json()) as StepFunAccountResponse

  return {
    type: data.type,
    balance: data.balance,
    totalCashBalance: data.total_cash_balance,
    totalVoucherBalance: data.total_voucher_balance,
  }
}
