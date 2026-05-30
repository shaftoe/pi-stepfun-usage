/**
 * StepFun Usage Checker - Pi Extension
 * API interaction functions
 */

import { buildAuthHeaders, safeFetch, safeParseJson } from "@alexanderfortin/pi-usage-lib"
import type { ModelRegistry } from "@earendil-works/pi-coding-agent"

const STEPFUN_ACCOUNT_API_URL = "https://api.stepfun.ai/v1/accounts"

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
  const headers = await buildAuthHeaders(modelRegistry, "stepfun")
  const response = await safeFetch(STEPFUN_ACCOUNT_API_URL, { headers })
  const data = await safeParseJson<StepFunAccountResponse>(response)

  return {
    type: data.type,
    balance: data.balance,
    totalCashBalance: data.total_cash_balance,
    totalVoucherBalance: data.total_voucher_balance,
  }
}
