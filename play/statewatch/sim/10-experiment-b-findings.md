# Experiment B — verification findings

**Inputs:**
- Brief: `01-brief.md`
- XState machine produced by subagent: `07-experiment-b-machine.js`
- Alloy model with events explicit: `08-experiment-b.als`

**How this report was produced:** Alloy 6.2.0 was executed against `08-experiment-b.als`. Each property below is a real assertion or run statement; each result is the actual solver output. A small Node script counted the (state, event) pairs separately.

---

## Shape of the machine

- **13 states**, **21 events**
- 13 × 21 = **273 possible (state, event) pairs**
- **53 transitions defined**
- **220 (state, event) pairs are silent** (no transition)

Silent pairs aren't all bugs — most are fine ("user can't enter a card while looking at the receipt"). The point of the verification step is to surface which silent pairs *should not* be silent and which *should*.

---

## Alloy results

```
00. check allStatesReachable              UNSAT   ✓ property holds
01. check noDeadlock                      UNSAT   ✓ property holds
02. check inFlightSurvivesSessionExpiry   SAT     ✗ counterexample found
03. check successCannotRegress            SAT     ✗ counterexample found
04. check stockHandledEverywhere          SAT     ✗ counterexample found
05. check networkTimeoutHandled           SAT     ✗ counterexample found
06. run   silentPair                      SAT     (220 silent pairs exist)
07. run   submitDuringProcessing          UNSAT   ✓ no double-submit possible
08. run   resumeDuringProcessing          SAT     ✗ confirms bug 02
09. run   sessionExpiryAfterSuccess       SAT     ✗ confirms bug 03
```

---

## Issues flagged for designer review

### Bug 1 — In-flight payments are killed by session expiry
**Found by:** `inFlightSurvivesSessionExpiry` (SAT), `resumeDuringProcessing` (SAT)

The brief explicitly says: *"An in-flight order is sacred — the server keeps the order record open until the payment processor returns a terminal status, regardless of session TTL."*

The XState machine inherits a top-level `SESSION_EXPIRED → .sessionLost` transition from the `flow` parent. This applies to **every** flow substate including `Processing`, `ThreeDSecure`, and `NetworkError`. Same with `RESUME` — fires from any state and drops to `reviewing`.

Concretely: a user submits payment, the PSP is mid-3DS, the session TTL expires. Right now the machine kicks them to `SessionLost`, losing the in-flight order context. The fix is to remove `SESSION_EXPIRED` and `RESUME` from the `flow.on` block and define them per-state, excluding `Processing`, `ThreeDSecure`, and `NetworkError`.

**Severity:** real bug. Directly contradicts a brief requirement.

### Bug 2 — Post-success states can regress
**Found by:** `successCannotRegress` (SAT), `sessionExpiryAfterSuccess` (SAT)

`Success` and `Receipt` both have transitions on `SESSION_EXPIRED → SessionLost` (inherited from flow parent) and `RESUME → Reviewing` (also inherited).

So: order placed, user is on the receipt screen. Session TTL expires. Right now they get dropped to `SessionLost` and lose the receipt. Or: they get a `RESUME` event from the host (refresh, focus, whatever) and are pushed back to `Reviewing`, where they could potentially start a new checkout that re-uses the wrong context.

**Severity:** real bug.

### Bug 3 — `STOCK_UNAVAILABLE` is not handled during payment
**Found by:** `stockHandledEverywhere` (SAT)

The XState machine handles stock changes only at `stockCheck` (one explicit point in the flow). Once the user is past `stockCheck`, `STOCK_UNAVAILABLE` has no transition defined in `PaymentEntry`, `PaymentReady`, `Processing`, or `ThreeDSecure`.

Real scenario: user is on the payment form, an inventory webhook fires saying their item just went out of stock. The machine has no defined behavior. Either the event is silently dropped (current behavior), or the host has to handle it outside the machine — undermining the source-of-truth principle.

The brief explicitly lists this case: *"Items going out of stock between adding to cart and paying."*

**Severity:** real bug.

### Bug 4 — `NetworkError` doesn't handle subsequent `NETWORK_TIMEOUT`
**Found by:** `networkTimeoutHandled` (SAT)

If the user is already in `NetworkError` (because the payment attempt timed out) and another `NETWORK_TIMEOUT` event fires (e.g., the polling request also times out), there's no transition. The event is silently dropped.

This one is closer to a *designer call*: it might be intentional (we're already in the right state, no need to re-transition) or it might be a missed opportunity to e.g. reset the retry counter or trigger a longer-backoff state.

**Severity:** designer call.

### Bug 5 — Idempotency holds ✓
**Confirmed by:** `submitDuringProcessing` (UNSAT)

`SUBMIT_PAYMENT` correctly has no transition from `Processing`. Double-submits are prevented at the state-machine level. This is one of the brief's explicit invariants and it holds in the formal model.

---

## What this experiment did NOT check

1. **Context invariants** — Alloy verified the state graph but not the `paymentInFlight` boolean, the `idempotencyKey` lifecycle, or the `retryCount` cap. To check those, the model needs to be extended to include context as part of the state. Doable, ~50 more lines.
2. **Concurrency** — multi-tab scenarios, race conditions between server callbacks. Alloy can model these but it wasn't in this pass.
3. **Orthogonal regions** — the `session` and `network` parallel regions were not encoded. The interaction between them (e.g., NETWORK_OFFLINE during SESSION_EXPIRED) is unmodelled.

---

## Awaiting designer review

For each bug above, the workflow stops here and waits for the designer to decide: real bug to fix, intentional to document, or scope-expand the model and re-verify.
