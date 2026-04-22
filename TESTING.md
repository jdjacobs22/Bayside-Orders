# Testing Guide

## Vitest — Unit & Component Tests

### Run all tests (single pass)
```bash
pnpm run test:run
```

### Run all tests (watch mode — re-runs on file changes)
```bash
pnpm run test
```

### Run a single test file
```bash
npx vitest run tests/lib/schemas.test.ts
```

### Test files

| File | What it covers |
|------|----------------|
| `tests/lib/schemas.test.ts` | Zod validation schemas (admin + captain) |
| `tests/lib/utils.test.ts` | Utility functions (serializePrisma, etc.) |
| `tests/lib/r2-client.test.ts` | R2 upload client |
| `tests/actions/work-order.test.ts` | Server actions (create, update work order) |
| `tests/components/CaptainSelect.test.tsx` | CaptainSelect dropdown component |
| `tests/components/WorkOrderForm/canEdit.test.ts` | Field-level permission logic |
| `tests/components/WorkOrderForm/useFinancialCalculations.test.ts` | Auto-calculation hook |
| `tests/components/WorkOrderForm/compressImage.test.ts` | Image compression (large file gate, fallback) |
| `tests/components/WorkOrderForm/ReceiptField.test.tsx` | Receipt upload field component |
| `tests/components/WorkOrderForm/AdminSection.test.tsx` | Admin section of the work order form |
| `tests/components/WorkOrderForm/CaptainSection.test.tsx` | Captain section (mutual exclusion checkboxes, disabled states) |

---

## Playwright — End-to-End Tests

### One-time browser setup
```bash
npx playwright install chromium
```

### Required environment variables
Set these before running (add to your shell profile or a `.env.test` file):

```bash
export TEST_ADMIN_EMAIL=your-admin@email.com
export TEST_ADMIN_PASSWORD=yourpassword

export TEST_CAPTAIN_EMAIL=captain@email.com
export TEST_CAPTAIN_PASSWORD=captainpassword

export TEST_CAPTAIN_ORDER_ID=1001   # a work order ID assigned to the captain
```

### Run all E2E tests (headless)
```bash
npx playwright test
```

### Watch the browser while tests run
```bash
npx playwright test --headed
```

### Interactive UI mode
```bash
npx playwright test --ui
```

### Run a single spec file
```bash
npx playwright test tests/e2e/financial-calc.spec.ts
```

### E2E test files

| File | What it covers |
|------|----------------|
| `tests/e2e/auth.setup.ts` | Login setup — saves admin and captain sessions to disk |
| `tests/e2e/admin-create.spec.ts` | Admin create flow — fill form, submit, verify success dialog |
| `tests/e2e/financial-calc.spec.ts` | Financial auto-calculation (tarifaHora × horasAcordadas = precioAcordado) |
| `tests/e2e/captain-permissions.spec.ts` | Captain permission gating — admin fields disabled, expense fields enabled |

### Notes
- The dev server starts automatically when you run `npx playwright test` (configured in `playwright.config.ts`)
- If the server is already running on port 3000, Playwright reuses it
- Session state (cookies) is saved to `tests/e2e/.auth/` after the setup step runs
