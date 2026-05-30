/**
 * StepFun Usage Checker - Pi Extension
 *
 * Monitors StepFun API account balance and automatically displays
 * the available balance in the footer when using a StepFun provider.
 */

import { createUsageExtension } from "@alexanderfortin/pi-usage-lib"
import { getStepFunAccount } from "./api"
import { formatMoney } from "./status"

export default createUsageExtension({
  providerPrefix: "stepfun",
  statusKey: "stepfun-usage",
  label: "StepFun",
  fetchUsage: getStepFunAccount,
  renderStatus: (data, theme) => {
    const displayBalance = formatMoney(data.balance)
    return theme.fg("muted", "StepFun:") + theme.fg("accent", ` ${displayBalance}`)
  },
})
