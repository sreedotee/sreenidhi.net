# Experiment A — direct AI generation (no FSM, no formal tools)

**Setup**: a subagent was spawned with no context about this experiment, state machines, or formal verification. It received only the designer's brief and was asked to produce a checkout flow design document.

**Subagent**: general-purpose, Claude Opus 4.7, no tool access, no workspace access.

**Prompt given to the subagent**: the designer brief from `01-brief.md`, with the instruction "produce a thoughtful checkout flow design, format it however you think best."

**Output below is verbatim from the subagent. No edits.**

---

# Checkout Flow Design

## 1. Design Principles

Three principles anchor every decision below:

1. **Money moves once.** The user can mash submit, lose Wi-Fi, refresh the page, or open the same checkout in two tabs. The system charges them exactly once or not at all — never twice, never "we're not sure."
2. **State survives reality.** Refresh, back button, expired session, dropped network — none of these should make the user re-enter what they already entered (except secrets like CVV).
3. **Tell the truth about what's happening.** When something is in flight, say so. When something failed, say what failed and what the user can do. Never show a spinner with no exit.

---

## 2. Major Screens

| # | Screen | Purpose |
|---|--------|---------|
| S1 | **Cart Review** | Confirm items, quantities, price, stock |
| S2 | **Shipping & Contact** | Address, email, shipping method |
| S3 | **Payment** | Card entry, billing address, order summary |
| S4 | **Review & Confirm** | Last-chance review, terms, "Place Order" |
| S5 | **Processing** | Locked, non-dismissable status screen while payment authorizes |
| S5a | **3DS Challenge** | Modal/iframe for bank verification, embedded inside Processing |
| S6 | **Confirmation** | Order number, receipt, what happens next |
| E1 | **Soft Error** | Recoverable: declined card, validation, retryable network |
| E2 | **Hard Error** | Unrecoverable for this session: order lost, contact support |
| E3 | **Stock Conflict** | Item went OOS mid-flow — surface inline on S1 or as interrupting modal |

S1–S4 are a stepper. S5 is a one-way door: once entered, the user cannot navigate back into S4 with the same idempotency key.

---

## 3. Primary User Journey

```
Cart (S1)
  -> Shipping (S2)
    -> Payment (S3)
      -> Review (S4)
        -> [Place Order clicked]
          -> Processing (S5) ----+---> Confirmation (S6)   [happy path]
                                 |
                                 +---> 3DS (S5a) -> S5 -> S6
                                 |
                                 +---> Soft Error (E1) -> back to S3 or S4
                                 |
                                 +---> Hard Error (E2)
```

Each step → next is a forward-only transition with persisted state. Each step ← previous is a non-destructive back: edits on S3 do not wipe S2.

---

## 4. State Model

### 4.1 What we persist

Persisted in **server-side session** keyed by `checkoutId` (a UUID minted when the user enters S1):

- `cartSnapshot`: items, prices, taxes, totals — frozen at entry to S3
- `shippingAddress`, `shippingMethod`
- `billingAddress`
- `contactEmail`
- `paymentMethodToken` (tokenized by payment processor — **never** raw PAN)
- `idempotencyKey` (UUID, minted once when user lands on S4)
- `orderStatus`: `draft | submitting | requires_action | succeeded | failed`
- `lastError` (structured: code, user-facing message, retryable bool)
- `expiresAt`

Persisted in **localStorage** (mirror, for fast restore after refresh):

- `checkoutId`, current step, form field values (excluding CVV, excluding card number after tokenization)

### 4.2 What we do NOT persist

- CVV (never, anywhere, ever — re-enter on retry)
- Full PAN beyond initial tokenization
- Anything from 3DS iframe

### 4.3 The state machine

```
DRAFT -> SUBMITTING -> SUCCEEDED
                   \-> REQUIRES_ACTION -> SUBMITTING -> SUCCEEDED
                   \-> FAILED (terminal-for-attempt)
```

`SUBMITTING` is sticky. Once entered, the client polls `/checkout/:id/status` and refuses to re-submit. This is the double-click defense.

---

## 5. The Idempotency Contract

This is the single most important implementation detail.

1. When the user lands on **S4 (Review)**, the client mints `idempotencyKey = uuid()` and stores it with the checkout.
2. When **Place Order** is clicked, client sends `POST /orders` with header `Idempotency-Key: <key>`.
3. The server, before charging, writes `(idempotencyKey, status=submitting)` to a unique-indexed table. If the row already exists, it returns the existing result (or current status) instead of re-charging.
4. The same key is reused for retries within this attempt. A **new key is only minted** when the user explicitly starts a new attempt after a hard failure or after editing payment details.

This means: double-click → second request hits the dedupe row → no second charge. Network retry from the client → same key → same outcome. User refreshes mid-submit → client reads persisted state, sees `SUBMITTING`, resumes polling instead of resubmitting.

---

## 6. Edge Case Handling

### 6.1 Declined card

- API returns `{ status: failed, code: card_declined, reason: insufficient_funds | do_not_honor | ... }`.
- Route to **E1 (Soft Error)**, rendered as a banner above the payment form on **S3**.
- Message maps by reason code:
  - `insufficient_funds` → "Your card was declined for insufficient funds. Try another card."
  - `do_not_honor` / generic → "Your bank declined this charge. Try another card or contact your bank."
- Clear `paymentMethodToken` and CVV; keep everything else. Mint a new `idempotencyKey` (the old attempt is terminal).
- Do **not** show the bank's raw error string.

### 6.2 3D Secure challenge

- API returns `{ status: requires_action, action: { type: 3ds_redirect | 3ds_iframe, url } }`.
- Render **S5a** as a modal overlay on top of S5. The Processing screen text changes to: "Your bank is verifying this payment. Complete the steps in the window above."
- Embed via iframe where the processor supports it; fall back to full-page redirect with `returnUrl = /checkout/:id/resume`.
- On return (success or fail), `/resume` reads the latest server status and routes to S6 / E1.
- Timeout: if the user sits on 3DS for >10 min, surface a "Still there? Cancel and try again" affordance that does **not** abandon the order on the server — it only closes the modal client-side.

### 6.3 Network failure during payment

Three sub-cases, distinguished by whether the request reached the server:

1. **Request never sent** (offline before submit): show inline retry, no state change.
2. **Request sent, no response** (timeout): the dangerous case. Client must NOT assume failure. Move to S5 in "verifying" mode and poll `/checkout/:id/status` with backoff (1s, 2s, 4s, 8s, capped at 15s, for up to 2 min). The idempotency key guarantees a retry is safe even if the original succeeded.
3. **Response received, was 5xx**: poll status as above. If status is still `draft` after the poll window, allow retry with the same idempotency key.

UI for the polling state: "Confirming your payment — this can take up to a minute. Please don't close this window."

### 6.4 Session expiry

- Session TTL: 30 min of inactivity, extended on any interaction.
- At T-2min, show a non-modal toast: "Your checkout will expire in 2 minutes. Click to extend."
- At expiry on S1–S4: redirect to cart with a banner. Cart contents and address fields are preserved (localStorage). Payment token is dropped.
- At expiry **during S5**: do not expire. An in-flight order is sacred — the server keeps the order record open until the payment processor returns a terminal status, regardless of session TTL.

### 6.5 Items going out of stock

Two checkpoints:

1. **Entering S3 (Payment)**: server re-validates stock and prices. Any change → interrupting modal on S3 listing the changes ("Item X is now out of stock and has been removed. Item Y's price changed from $20 to $22."). User must acknowledge to proceed. Cart total recomputes.
2. **At submit on S4**: server re-validates one final time inside the same transaction that creates the order. If a conflict is detected here, the order is not created, the user is routed back to S1 with **E3 (Stock Conflict)** explaining what changed. No charge occurs because the order never reached the payment step server-side.

A small price drift (e.g., tax recalculation under $0.50 from address normalization) should be applied silently with a non-blocking notice rather than an interrupting modal.

### 6.6 Back navigation

- S1 → S4: browser back works normally, no data loss. The stepper UI also provides explicit "Edit" links from S4 back to any prior step.
- During S5: back button is intercepted. Show a confirm dialog: "Your payment is being processed. Leaving may not cancel it. Are you sure?" If the user confirms, route to a status page that polls — do **not** silently land them on S3, which would invite a re-submit.
- After S6: back button to checkout shows "This order is complete. View order →" rather than re-rendering S4.

### 6.7 Double-click / double-submit

- The Place Order button disables on click and shows an in-button spinner.
- Independently, the client enforces a submit lock keyed on `idempotencyKey`.
- Independently, the server dedupes on `idempotencyKey`.
- Three layers because button-disable alone fails when the user opens two tabs.

### 6.8 Two tabs / two devices

- Both tabs share the same `checkoutId` via localStorage.
- A `BroadcastChannel` listener: when tab A enters `SUBMITTING`, tab B receives the event and renders S5 (read-only) pointed at the same status poll.
- If BroadcastChannel is unavailable, the idempotency key still prevents double-charge; the worst case is tab B shows a stale state until next poll.

### 6.9 Refresh at any point

- On mount, the checkout shell reads `checkoutId` from localStorage, calls `GET /checkout/:id`, and rehydrates to the correct step based on server state — not client state. Server is the source of truth.
- If server state is `submitting` or `requires_action`, route directly to S5 / S5a regardless of which URL the user reloaded.
- If server state is `succeeded`, route to S6.
- If `checkoutId` is missing or expired, route to S1 with whatever localStorage preserved.

---

## 7. UI States to Track (per screen)

**Global:**
- `checkoutId`, `currentStep`, `orderStatus`, `isSubmitting`, `lastError`, `sessionExpiresAt`

**S1 Cart:** `items[]`, `stockWarnings[]`, `priceWarnings[]`, `isRevalidating`

**S2 Shipping:** form values, `addressValidationStatus`, `shippingOptions[]`, `selectedShippingId`

**S3 Payment:** `paymentMethodToken | null`, `cardBrand`, `last4`, `billingAddressSameAsShipping: bool`, `cvvEntered: bool` (not the value), field-level validation errors

**S4 Review:** `termsAccepted: bool`, `idempotencyKey`, `submitButtonState: idle | submitting | locked`

**S5 Processing:** `pollAttempt`, `pollMaxAttempts`, `elapsedMs`, `showVerifyingMessage` (after 5s)

**S5a 3DS:** `challengeUrl`, `challengeStartedAt`, `showStuckAffordance` (after 10 min)

**S6 Confirmation:** `orderNumber`, `receiptUrl`, `emailConfirmationSent`

**Error screens:** `errorCode`, `userMessage`, `retryable: bool`, `retryAction`

---

## 8. Component Behavior Notes for Engineering

- **Place Order button** is its own component with three internal states (`idle`, `submitting`, `locked-post-submit`). It owns the submit lock and the disabled flag. Never let parent components re-enable it by re-rendering.
- **Card input** uses the processor's hosted fields (Stripe Elements / Braintree Hosted Fields equivalent). The PAN never touches our DOM or our servers. We receive only a token.
- **Address forms** debounce autocomplete (300ms) and revalidate on blur, not on every keystroke.
- **Polling** uses exponential backoff with jitter. Cap total wait at 2 min, after which surface E2 with a "your card may have been charged — check your email or contact support with reference `checkoutId`" message. Never silently give up.
- **Stepper component** is purely visual on S1–S4. It does not own navigation — the router does. Clicking a completed step is a router event that the step can intercept if it has unsaved changes.
- **Currency formatting** happens once, at render, from a single helper. Never store formatted strings in state.

---

## 9. Analytics / Observability Hooks

Engineering should emit events for:

- `checkout_step_viewed` (step, checkoutId)
- `checkout_step_completed` (step, durationMs)
- `payment_submitted` (idempotencyKey)
- `payment_succeeded` / `payment_failed` (code)
- `3ds_challenged`, `3ds_completed`
- `stock_conflict_shown` (which checkpoint)
- `session_extended`, `session_expired_at_step`
- `double_submit_blocked` (which layer caught it — useful for tuning)

These let us measure where the flow leaks and confirm the robustness guarantees are holding in production.

---

## 10. Out of Scope (Flag for Follow-up)

- Guest vs. logged-in account creation flow (affects S2)
- Saved payment methods / wallet selection (affects S3)
- Apple Pay / Google Pay sheet (replaces S3+S4 with a single sheet — separate design)
- Promo codes / gift cards (affects S1 and S4)
- Multi-currency display
- Partial refunds and post-purchase edits

Each of these is a real product surface but layers cleanly on top of the spine above. The core guarantees — idempotent submit, persisted state, honest status — must not be broken by any of them.
