/**
 * StepFun Usage Checker - Pi Extension
 * Footer status management
 */

import type {
  ExtensionContext as PiExtensionContext,
  ModelRegistry as PiModelRegistry,
} from "@earendil-works/pi-coding-agent"
import { Temporal } from "temporal-polyfill"
import { getStepFunAccount, type StepFunAccountData } from "./api"

export type FetchAccountFn = (
  modelRegistry: Pick<PiModelRegistry, "getApiKeyForProvider">,
) => Promise<StepFunAccountData>

/** Format a monetary value with dollar sign */
export function formatMoney(amount: number): string {
  const abs = Math.abs(amount).toFixed(2)
  return amount < 0 ? `-$${abs}` : `$${abs}`
}

/** Check if a provider name is a StepFun provider (e.g., "stepfun", "stepfun-extra", etc.) */
export function isStepFunProvider(provider: string | undefined): boolean {
  return provider?.toLowerCase().startsWith("stepfun") ?? false
}

/** Check if current model is a StepFun model */
export function isCurrentModelStepFun(ctx: PiExtensionContext): boolean {
  return isStepFunProvider(ctx.model?.provider)
}

/** Cache for StepFun balance data to avoid excessive API calls */
export class StepFunBalanceCache {
  private lastBalance: StepFunAccountData | null = null
  private lastFetchTime = 0
  private static readonly FETCH_COOLDOWN_MS = 30_000 // Only fetch every 30 seconds

  /** Build and set footer status string from balance data */
  private setStatusFromBalance(ctx: PiExtensionContext, accountData: StepFunAccountData) {
    const theme = ctx.ui.theme
    const displayBalance = formatMoney(accountData.balance)
    const status = theme.fg("muted", "StepFun:") + theme.fg("accent", ` ${displayBalance}`)
    ctx.ui.setStatus("stepfun-usage", status)
  }

  /** Update footer status with StepFun balance information */
  async updateStatus(ctx: PiExtensionContext, fetchAccount: FetchAccountFn = getStepFunAccount) {
    try {
      const now = Temporal.Now.instant().epochMilliseconds

      // Use cached data if still fresh
      if (
        this.lastBalance &&
        this.lastFetchTime &&
        now - this.lastFetchTime < StepFunBalanceCache.FETCH_COOLDOWN_MS
      ) {
        this.setStatusFromBalance(ctx, this.lastBalance)
        return
      }

      const accountData = await fetchAccount(ctx.modelRegistry)
      this.lastBalance = accountData
      this.lastFetchTime = now
      this.setStatusFromBalance(ctx, accountData)
    } catch (error) {
      console.error(`Error updating StepFun balance: ${error}`)
      this.clear(ctx)
    }
  }

  /** Clear StepFun balance footer status */
  clear(ctx: PiExtensionContext) {
    ctx.ui.setStatus("stepfun-usage", undefined)
  }
}
