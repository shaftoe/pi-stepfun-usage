/**
 * StepFun Usage Checker - Pi Extension
 * Formatting utilities
 */

/** Format a monetary value with dollar sign */
export function formatMoney(amount: number): string {
  const abs = Math.abs(amount).toFixed(2)
  return amount < 0 ? `-$${abs}` : `$${abs}`
}
