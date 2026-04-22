# WorkOrderForm Refactor Notes

Branch: `refactor-WorkOrderForm`

## Overview

`components/workOrderForm.tsx` was a 2361-line monolithic component. This refactor is
breaking it into smaller, focused pieces. The `components/WorkOrderForm/` directory
(previously empty) is the destination for extracted modules.

Result after Phases 1 & 2: **2361 → 2027 lines** (−334 lines).
Result after Phase 3: **2027 → 1717 lines** (−310 lines). Running total: **−644 lines**.
Result after Phase 4: **1717 → 839 lines** (−878 lines). Running total: **−1522 lines**.
Result after Phase 5: **839 → 773 lines** (−66 lines). Running total: **−1588 lines**.

---

## Phase 1 — Dead Code Removal

### Changes
- Removed the 110-line commented-out old `handleFileSelect` function (the
  `browser-image-compression` based version that was replaced by a native
  `createImageBitmap` approach for Samsung A53 stability).
- Removed the unused `import imageCompression from 'browser-image-compression'`
  (only referenced by the now-deleted commented block).

### Why it was safe
Zero behavior change — commented code is not executed. The active `handleFileSelect`
(native decode + canvas resize) was already in place above the deleted block.

---

## Phase 2 — Extract Custom Hooks

Three hooks extracted to `components/WorkOrderForm/`:

### `useDebugLog.ts`
Manages the debug overlay used for diagnosing issues on mobile devices (Samsung A53)
where browser console access is limited.

**Extracted from `workOrderForm.tsx`:**
- `debugMode` state + localStorage persistence effect
- `debugLogs` state + on-mount log-loading effect
- `addDebugLog(msg)` function (timestamps, optional heap memory annotation)
- `clearDebugLogs()` function

**Returns:** `{ debugMode, setDebugMode, debugLogs, addDebugLog, clearDebugLogs }`

---

### `useClientLookup.ts`
Handles all server lookups related to captain/client identity — debounced fetches
triggered by the nombre/apellido dropdowns.

**Extracted from `workOrderForm.tsx`:**
- `apellidosList`, `nombresList`, `discoveredCaptainId` state
- Effect: fetch apellidos when `nombre` changes (400ms debounce); auto-populates
  apellido if only one match exists
- Effect: fetch client details (email, cell, userId) when both nombre + apellido are
  set (500ms debounce); shows toast error if name not found in DB
- Effect: fetch all unique nombres on mount

**Imports moved from main file:** `getClientApellidosByNombre`, `getUniqueNombresFromUsers`
(Note: `getClientDetails` stays in the main file — also used in `onSubmit` validation.)

**Returns:** `{ apellidosList, nombresList, discoveredCaptainId, setDiscoveredCaptainId }`

(`setDiscoveredCaptainId` is returned because the main component calls it directly in
the nombre `Select` onChange and in the getWorkOrder data-loading effect.)

---

### `useFinancialCalculations.ts`
Recalculates all derived financial fields whenever any input changes, applying updates
only when the value has actually changed to prevent re-render loops.

**Extracted from `workOrderForm.tsx`:**
- The consolidated `useEffect` that computes:
  - `precioAcordado` = `tarifaHora × horasAcordadas`
  - `cargoExtra` = `tarifaHora × horasExtras`
  - `totalClienteCost` = `precioAcordado + cargoExtra + gastoVarios`
  - `saldoCliente` / `debidoABayside` = `totalClienteCost − deposito − pagoRecibo − pagoHorasExtra`
  - `ingresoNeto` = `(precioAcordado + cargoExtra) − (combustible + hielo + aguaBebidas + gastoVarios + pagoCapitana + pagoMarinero)`

**Interface note:** All numeric params typed as `number | undefined` because several
form fields are optional in the Zod schema. The hook coerces internally with `|| 0`.

**Returns:** nothing (side-effects only via `setValue`)

---

## Changes to `workOrderForm.tsx` imports

| Import | Change |
|---|---|
| `imageCompression` from `browser-image-compression` | Removed (Phase 1) |
| `getClientApellidosByNombre` from `work-order` | Removed (moved to hook) |
| `getUniqueNombresFromUsers` from `work-order` | Removed (moved to hook) |
| `useDebugLog` from `./WorkOrderForm/useDebugLog` | Added |
| `useClientLookup` from `./WorkOrderForm/useClientLookup` | Added |
| `useFinancialCalculations` from `./WorkOrderForm/useFinancialCalculations` | Added |

`getValues` was also added to the `useForm` destructure so it could be passed to the hooks.

---

## Phase 3 — Extract Repeated UI Pattern

### `ReceiptField.tsx`
The camera-icon + thumbnail grid pattern was duplicated six times. Replaced with a
single `components/WorkOrderForm/ReceiptField.tsx` component.

**Two variants unified by props:**

| Variant | Fields | Camera condition | Input width |
|---|---|---|---|
| Captain expense | combustible, hielo, aguaBebidas, gastoVarios | `isCaptain` | `flex-1` |
| Payment receipt | pagoRecibo, pagoHorasExtra | `mode === "admin-edit" \|\| "captain-edit"` | `w-24` |

**Props:**
- `label`, `field`, `gastoType`, `receipts`, `disabled`, `showCamera`, `uploading`
- `onFileSelect`, `onPhotoClick` — callbacks passed down from parent
- `inputClassName` — overrides default `flex-1` + disabled shading (used by payment variant)
- `formItemClassName` — applied to `FormItem` wrapper (payment variant uses `"w-full"`)
- `floor` — applies `Math.floor` to onChange values (payment variant)
- `placeholder` — passed to Input (payment variant uses `"Monto"`)

**Bug fixed:** The original captain expense fields used `field.value && Number(field.value) === 0 ? "" : ...`
which never showed empty for 0 due to JS short-circuit evaluation (`0 && true` is falsy,
falling through to `0.toString()` = `"0"`). The component uses the correct
`Number(field.value) === 0 ? "" : ...` pattern, consistent with the rest of the form.

**Import removed from `workOrderForm.tsx`:** `Camera` from lucide-react (now lives only
in `ReceiptField.tsx`). Added: `ReceiptField` from `./WorkOrderForm/ReceiptField`.

### Bug fix — camera missing on mobile (captain expense fields)

After Phase 3 shipped, the camera icon was not appearing on mobile devices for the four
captain expense fields. The original condition `orderId && isCaptain` was passed as
`showCamera={!!(orderId && isCaptain)}`. If `orderId` state was null on the first render
cycle (a device-dependent timing edge case), `showCamera` evaluated to `false` and the
camera was never shown.

**Fix:** Changed to `showCamera={isCaptain}`. The `orderId` guard was redundant — captains
only ever reach this form when editing an existing order, so `isCaptain` alone is the
correct and complete condition.

---

## Bug Fixes (non-refactor)

### Sign-out hang on mobile — `app/page.tsx`

**Symptoms (both found during mobile captain testing):**
1. After sign-out, the app redirected straight back to the dashboard instead of staying on the login page.
2. After fixing #1, the app hung on "Validando sesión…" indefinitely.

**Root cause:**
Better Auth stores the session token in an **HttpOnly cookie**. JavaScript cannot read or clear HttpOnly cookies, so the `clearAllCookies()` call in `SignOutButton.tsx` is a no-op for the actual session token. If `authClient.signOut()` does not successfully clear the cookie server-side (e.g. mobile network timing, browser cookie restrictions), the cookie survives the redirect.

When the page reloads at `/?signout=true`:
- `authClient.useSession()` fetches `/api/auth/get-session`, finds a valid cookie, returns the session.
- The session-redirect `useEffect` sees `session` as truthy → pushes to `/admin` (bug #1).
- After blocking that redirect, `isPending || (session && !isHidingForSignOut)` stays true → spinner never clears (bug #2).

**Fix — `app/page.tsx`:**

1. Added `justSignedOutRef` — a `useRef` initialized at component creation from both `sessionStorage.getItem("justSignedOut")` and the `?signout=true` URL param. Initializing at creation (not in an effect) is critical: it survives the `router.replace("/")` call that wipes both indicators and triggers a re-render, which is exactly when the redirect and spinner conditions are re-evaluated.

2. First `useEffect` now sets `justSignedOutRef.current = true` when either sign-out indicator is present, keeping the ref in sync for subsequent re-renders.

3. Session-redirect `useEffect` now returns early when `justSignedOutRef.current` is true — prevents the back-redirect even if the session cookie survived.

4. Loading-screen condition changed from:
   ```
   isPending || (session && !isHidingForSignOut)
   ```
   to:
   ```
   isPending || (session && !isHidingForSignOut && !justSignedOutRef.current)
   ```
   When in sign-out flow the stale session is ignored and the login form renders immediately.

The ref resets naturally on the next full-page navigation (when the user signs back in via `window.location.href`), so normal auto-redirect for already-authenticated users is unaffected.

---

### Sign-in requires two attempts after sign-out — `app/page.tsx`

**Symptom:** After sign-out, tapping Sign In on the first attempt returned to the login page; only the second attempt advanced to the dashboard.

**Root cause:**
`justSignedOutRef.current` remained `true` after a successful sign-in. `window.location.href = "/captain"` triggers a full navigation, but on mobile the browser can briefly loop back to `/` (e.g. middleware redirect before the new session cookie is committed). When the component re-mounted with the ref still `true`, the session-redirect `useEffect` treated the fresh, valid session as a stale sign-out session and refused to redirect — leaving the user stranded on the login page. The user had to sign in a second time, at which point the ref was `false` (reset by full navigation) and the redirect fired normally.

**Fix — `handleSignIn` in `app/page.tsx`:**

Reset `justSignedOutRef.current = false` immediately after `authClient.signIn.email()` succeeds and before `window.location.href` navigation:

```typescript
if (result?.error) { ... return; }

// Clear sign-out guard so auto-redirect works if navigation loops back to "/"
justSignedOutRef.current = false;

window.location.href = userRole === "admin" || userRole === "representante" ? "/admin" : "/captain";
```

This ensures that if the page does loop back to `/`, the session-redirect effect sees a valid session with no sign-out guard and completes the redirect automatically.

---

### Photo capture OOM crash on Samsung A53 — `components/WorkOrderForm/index.tsx`

**Symptom (iteration 1):** Taking a receipt photo on the Samsung A53 crashed the browser tab.

**Symptom (iteration 2, after iteration 1 fix):** No crash, but the photo never appeared in the form and was not stored in R2. No visible error.

**Root cause — iteration 1:**
`createImageBitmap(file, { resizeWidth: 1200, resizeQuality: 'medium' })` passes resize hints that are part of the spec but are **not reliably implemented on Samsung Internet / older Android Chrome**. When the browser ignores them it decodes the full 64 MP sensor image — ~9000 × 6000 px × 4 bytes ≈ 256 MB — before handing back the `ImageBitmap`. The memory spike causes a tab OOM crash.

**Root cause — iteration 2:**
After the inner try/catch was added to fall back to `browser-image-compression`, the A53 stopped crashing — but the symptom changed: no upload, no error, UI stuck. The cause is that on the A53, `createImageBitmap` with a 64 MP source doesn't always throw. It can **hang** — the Promise never resolves. `setCompressing(true)` locks the UI, the inner try/catch never fires, and execution never reaches the upload. The fallback was never taken.

**Fix — `handleFileSelect` in `workOrderForm.tsx`:**

Three layers of defence:

1. **`Promise.race` timeout on `createImageBitmap`.**  
   Race the decode against an 8-second timeout rejection. If the bitmap hangs (A53 behaviour), the timeout rejects first, the inner `catch` runs, and the fallback takes over. Also handles the OOM-throws case from iteration 1.
   ```typescript
   const bitmap = await Promise.race([
     createImageBitmap(originalFile, { resizeWidth: 1200, resizeQuality: 'medium' }),
     new Promise<never>((_, reject) => setTimeout(() => reject(new Error("bitmap_timeout")), 8000)),
   ]);
   ```

2. **Explicit canvas clamp after `createImageBitmap`.**  
   After the bitmap is decoded, `scale = min(1, 1200 / max(width, height))` is applied before drawing to the canvas. Guards against browsers that honor the API but resize only the short side.

3. **`browser-image-compression` fallback (inner catch).**  
   If the primary path throws or times out:
   ```typescript
   await imageCompression(originalFile, {
     maxSizeMB: 0.4,
     maxWidthOrHeight: 1200,
     useWebWorker: false,   // critical: web worker opens a second memory arena → double the RAM
     initialQuality: 0.75,
   });
   ```
   `useWebWorker: false` is the key flag — the original crash was caused by the web worker's separate memory arena pushing total usage over the tab budget.

   The import is dynamic (`await import('browser-image-compression')`) so the library is only loaded when the fallback is actually needed.

The outer try/catch handles any remaining failures (canvas unavailable, upload error, etc.).

**Symptom (iteration 3):** Tab still crashed with OOM on Samsung A53 despite the `Promise.race` timeout fix.

**Root cause — iteration 3:**
`Promise.race` cannot prevent the OOM. When `createImageBitmap(file)` is called, the browser allocates memory for the full decoded image *synchronously at call time* — before the returned Promise is awaited or the race is evaluated. On a 64MP file (~256 MB decoded), the tab crashes at that instant, before any timeout can fire.

**Fix — iteration 3:**
Added a file size gate before entering the `createImageBitmap` path. Files over **5 MB** (Samsung A53 64MP JPEGs are typically 15–25 MB) skip `createImageBitmap` entirely and go straight to the `browser-image-compression` fallback. `createImageBitmap` is only attempted for smaller files where the decoded size is safe. The `Promise.race` timeout guard is retained for the small-file path to handle any browser that hangs on decode.

---

---

## Phase 4 — Extract Form Sections

Two large JSX blocks extracted to `components/WorkOrderForm/`:

### `AdminSection.tsx` (631 lines)
The blue "Administración" card — all captain/client identity fields, booking details,
date picker, financial inputs, and calculated summary fields.

**Props:**
| Prop | Type | Purpose |
|---|---|---|
| `control` | `Control<any>` | Passed to all `FormField` components |
| `canEdit` | `(field: string) => boolean` | Determines disabled state per field |
| `nombreCliente` | `string` | Drives apellido select disabled/placeholder state |
| `nombresList` | `string[]` | From `useClientLookup` |
| `apellidosList` | `string[]` | From `useClientLookup` |
| `setValue` | `UseFormSetValue<any>` | Clears apellido/email/cell when nombre changes |
| `setDiscoveredCaptainId` | `(id: string \| null) => void` | Clears captain link when nombre changes |

### `CaptainSection.tsx` (387 lines)
The "Reporte de Capitana" section — payment checkboxes, receipt fields, expense inputs,
extra hours, and notes.

**Props:**
| Prop | Type | Purpose |
|---|---|---|
| `control` | `Control<any>` | Passed to all `FormField` components |
| `canEdit` | `(field: string) => boolean` | Determines disabled state per field |
| `isCaptain` | `boolean` | Controls `showCamera` on expense fields |
| `mode` | `string \| undefined` | Controls `showCamera` on payment receipt fields |
| `getReceiptsByGasto` | `(type: string) => any[]` | Provides receipt thumbnails to `ReceiptField` |
| `uploading` | `boolean` | Passed to `ReceiptField` |
| `handleFileSelect` | callback | Passed to `ReceiptField` |
| `handlePhotoClick` | callback | Passed to `ReceiptField` |
| `setValue` | `UseFormSetValue<any>` | Mutual exclusion for efectivo/transferir checkboxes |

### Imports removed from `workOrderForm.tsx`
`format`, `es` (date-fns), `CalendarIcon`, `Clock`, `User`, `DollarSign` (lucide),
`CaptainSelect`, `Input`, `Textarea`, `Calendar`, `Popover/PopoverContent/PopoverTrigger`,
`FormControl/FormField/FormItem/FormLabel/FormMessage`, `Select` family,
`Prisma`, `ReceiptField`.

Remaining in main file: `Ship`, `Anchor` (header + error state), `Button`, `Form`,
`Card` family, `cn`, schema imports, hook imports.

---

---

## Phase 5 — Extract Dialogs

Three overlay/modal blocks extracted to `components/WorkOrderForm/`:

### `CompressingModal.tsx`
Full-screen overlay shown while an image is being compressed before upload.

**Props:**
| Prop | Type | Purpose |
|---|---|---|
| `open` | `boolean` | Shows/hides the modal (driven by `compressing` state) |

Renders nothing when `open` is false (early return).

---

### `PhotoDialog.tsx`
Full-screen overlay for enlarging a receipt photo when the thumbnail is tapped.

**Props:**
| Prop | Type | Purpose |
|---|---|---|
| `photo` | `string \| null` | URL of the photo to display; null hides the dialog |
| `onClose` | `() => void` | Called on backdrop click or × button click |

Renders nothing when `photo` is null (early return). Revocation of blob URLs is
handled by `closePhotoDialog` in the orchestrator before calling `onClose`.

---

### `SuccessDialog.tsx`
Full-screen overlay shown after a new work order is successfully created, displaying
the assigned order number and a "Continuar" button that navigates to `/admin/list`.

**Props:**
| Prop | Type | Purpose |
|---|---|---|
| `open` | `boolean` | Driven by `showSuccessDialog` state |
| `orderId` | `number \| null` | The newly created order ID to display |
| `onClose` | `() => void` | Resets state and navigates to `/admin/list` |

Renders nothing when `open` is false or `orderId` is null (early return).

---

### Imports removed from `index.tsx`
None — the dialog blocks used only inline HTML/Tailwind, no imported symbols.
Three new imports added: `CompressingModal`, `PhotoDialog`, `SuccessDialog`.

---

## Phase 6 — Complete (module resolution fix)

Rather than a separate reorganize step, Phase 6 was completed as part of fixing a
module resolution bug (see below). `workOrderForm.tsx` no longer exists.

### What happened
All three consumer pages (`app/admin/create/page.tsx`, `app/admin/order/[id]/page.tsx`,
`app/captain/order/[id]/page.tsx`) import from `"@/components/WorkOrderForm"`. When
Phase 2 created the `WorkOrderForm/` directory without an `index.tsx`, the bundler on
macOS (case-insensitive filesystem) resolved the import ambiguously — sometimes to the
file, sometimes to the directory — causing the admin nombre Select to malfunction.

A first attempt at `WorkOrderForm/index.tsx` re-exporting from `"../workOrderForm"` was
rejected by TypeScript's `forceConsistentCasingInFileNames` check: it saw both
`WorkOrderForm.tsx` (the cached path for `@/components/WorkOrderForm`) and
`workOrderForm.tsx` (the actual file, lowercase w) as the same file with conflicting
casing.

**Fix:** Moved the full orchestrator content into `WorkOrderForm/index.tsx` (updating
the five sub-module imports from `@/components/WorkOrderForm/X` to relative `./X`),
then deleted `components/workOrderForm.tsx`. The directory is now the sole module entry
point; the casing conflict is gone.
