/**
 * StepFun Usage Checker - Pi Extension
 *
 * Monitors StepFun API account balance and automatically displays
 * the available balance in the footer when using a StepFun provider.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { isCurrentModelStepFun, isStepFunProvider, StepFunBalanceCache } from "./status"

export default function (pi: ExtensionAPI) {
  const cache = new StepFunBalanceCache()

  // Show footer at session start (only when using StepFun model)
  pi.on("session_start", async (_event, ctx) => {
    if (isCurrentModelStepFun(ctx)) {
      await cache.updateStatus(ctx)
    }
  })

  // Update footer on model select
  pi.on("model_select", async (event, ctx) => {
    if (isStepFunProvider(event.model.provider)) {
      await cache.updateStatus(ctx)
    } else {
      cache.clear(ctx)
    }
  })

  // Update footer after each turn
  pi.on("turn_end", async (_event, ctx) => {
    if (isCurrentModelStepFun(ctx)) {
      await cache.updateStatus(ctx)
    }
  })

  // Clear footer on session shutdown
  pi.on("session_shutdown", async (_event, ctx) => {
    cache.clear(ctx)
  })
}
