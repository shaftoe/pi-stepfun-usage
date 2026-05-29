# Plan: `pi-stepfun-usage` Extension

A Pi extension that monitors your [StepFun](https://platform.stepfun.ai/) API account balance and displays it in the footer when using a StepFun provider — modelled after `pi-deepseek-usage`.

**Scope:** Footer balance display only. Provider registration remains in `extensions/stepfun.ts`.

---

## StepFun Account API

**Endpoint:** `GET https://api.stepfun.ai/v1/accounts/get`
**Auth:** `Authorization: Bearer $STEP_API_KEY`

**Response:**
```json
{
  "object": "account",
  "type": "prepaid",
  "balance": 12.50,
  "total_cash_balance": 25.00,
  "total_voucher_balance": 26.00
}
```

Key differences from DeepSeek:
- Single balance object (no array of currencies)
- `balance` = current available balance
- `total_cash_balance` = total deposited
- `total_voucher_balance` = promotional credits
- `type` = `"prepaid"` or `"postpaid"`

---

## File Structure

Mirror `pi-deepseek-usage` exactly:

```
pi-stepfun-usage/
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       ├── release.yml
│       ├── test-and-coverage.yml
│       ├── daily-deps-update.yml
│       └── pi.yml
├── .gitignore
├── .releaserc.js
├── AGENTS.md
├── CHANGELOG.md
├── LICENSE
├── README.md
├── biome.json
├── bun.lock              (generated)
├── package.json
├── tsconfig.json
├── tsconfig.test.json
├── tests/
│   ├── tsconfig.json
│   ├── api.test.ts
│   └── status.test.ts
└── src/
    ├── index.ts          # extension entry point (provider + footer)
    ├── api.ts            # StepFun account API client
    └── status.ts         # footer status cache + display logic
```

**No `datetime.ts`** — StepFun's API doesn't return expiry timestamps, so the datetime utilities are unnecessary.

---

## Source Files

### `src/api.ts` — StepFun Account API

Pure API client — no provider registration.

```typescript
// Types
interface StepFunAccountResponse {
  object: "account"
  type: "prepaid" | "postpaid"
  balance: number
  total_cash_balance: number
  total_voucher_balance: number
}

interface StepFunAccountData {
  type: "prepaid" | "postpaid"
  balance: number              // current available
  totalCashBalance: number     // total deposited
  totalVoucherBalance: number  // promotional credits
}
```

- `getStepFunAccount(modelRegistry)` → fetches `GET /v1/accounts/get`
- Resolves API key via `modelRegistry.getApiKeyForProvider("stepfun")`
- Maps snake_case → camelCase
- Throws on missing key or non-OK response

### `src/status.ts` — Footer Cache & Display

- `StepFunBalanceCache` class (mirrors `DeepSeekBalanceCache`):
  - 30-second cooldown
  - `updateStatus(ctx)` → fetches balance, renders footer
  - `clear(ctx)` → removes footer
- Footer format: `StepFun: $12.50` (using `ctx.ui.theme.fg`)
- Helper functions: `formatMoney()`, `isStepFunProvider()`, `isCurrentModelStepFun()`

No changes to provider registration — that stays in `extensions/stepfun.ts`.

### `src/index.ts` — Extension Entry Point

Footer balance monitoring only — provider registration stays in `extensions/stepfun.ts`.

```typescript
export default function (pi: ExtensionAPI) {
  const cache = new StepFunBalanceCache()

  pi.on("session_start", ...)   // show if stepfun active
  pi.on("model_select", ...)    // show/clear on switch
  pi.on("turn_end", ...)        // refresh after each turn
  pi.on("session_shutdown", ...)// cleanup
}
```

---

## Test Files

### `tests/api.test.ts`

Test cases (mocking `global.fetch`):

| Test | Description |
|------|-------------|
| Missing API key | Throws "Missing StepFun API credentials" |
| Empty API key | Throws same error |
| 401 response | Throws "API request failed with status 401" |
| 500 response | Throws "API request failed with status 500" |
| Valid prepaid response | Returns mapped camelCase data |
| Valid postpaid response | Handles `type: "postpaid"` |
| Zero balances | Handles `0.00` values |
| Correct endpoint | Verifies URL is `https://api.stepfun.ai/v1/accounts/get` |
| Correct auth header | Verifies `Authorization: Bearer <key>` |
| Custom API key | Uses key from modelRegistry |

### `tests/status.test.ts`

Test cases (mock context + fetch):

| Test | Description |
|------|-------------|
| `formatMoney` positive USD | `"$12.50"` |
| `formatMoney` zero | `"$0.00"` |
| `isStepFunProvider` matches | `"stepfun"` → true |
| `isStepFunProvider` no match | `"openai"` → false |
| `isStepFunProvider` case insensitive | `"STEPFUN"` → true |
| `isStepFunProvider` undefined | false |
| `isCurrentModelStepFun` | Various model.provider values |
| Cache sets status on fetch | Footer shows balance |
| Cache uses cached data | 2nd call within 30s skips fetch |
| Cache clears on error | Sets status to undefined |
| Error logged to console | Verifies console.error |

---

## Config Files

| File | Notes |
|------|-------|
| `package.json` | `@alexanderfortin/pi-stepfun-usage`, same deps/scripts as deepseek-usage |
| `tsconfig.json` | Identical to deepseek-usage |
| `tsconfig.test.json` | Identical |
| `biome.json` | Identical |
| `.releaserc.js` | Identical |
| `.gitignore` | Identical |
| `AGENTS.md` | Same rules (bun test + check, Temporal-only dates) |
| `LICENSE` | MIT |

### GitHub Workflows

Copy from `pi-deepseek-usage` unchanged:
- `release.yml` — semantic-release on push to master
- `test-and-coverage.yml` — bun check + test + codecov
- `daily-deps-update.yml` — auto dependency PRs
- `pi.yml` — Pi agent on PR comments
- `dependabot.yml` — weekly GitHub Actions updates

---

---

## Implementation Order

1. **Scaffold** — package.json, tsconfig files, biome.json, .gitignore, .releaserc.js, AGENTS.md, LICENSE
2. **`src/api.ts`** — API types + fetch function
3. **`src/status.ts`** — Cache class, formatting, provider detection
4. **`src/index.ts`** — Extension entry (provider + event handlers)
5. **Tests** — `tests/api.test.ts`, `tests/status.test.ts`
6. **GitHub workflows** — copy + adapt from deepseek-usage
7. **Docs** — README.md, CHANGELOG.md
8. **`bun install && bun run check && bun run test`** — verify everything passes
