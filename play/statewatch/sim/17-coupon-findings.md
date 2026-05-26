# Findings — gift coupon feature extension

This documents the maintenance workflow: adding a new feature to an already-verified machine, then re-running Alloy.

## Inputs
- Starting point: `12-checkout-verified.machine.js` (already-verified machine, all 6 properties holding)
- Extension: `15-checkout-with-coupon.machine.js` (adds 3 states, 7 events, ~9 transitions)
- Alloy model: `16-checkout-with-coupon.als`

## Time spent on extension
~15 minutes from "designer says add gift coupon" to "Alloy results in hand."

---

## Result

### Existing core invariants — all still hold ✓
The 6 properties Alloy already verified before the extension continue to hold after. The extension didn't break anything verified.

```
00. allStatesReachable              UNSAT  ✓ still holds
01. noDeadlock                      UNSAT  ✓ still holds
02. inFlightSurvivesSessionExpiry   UNSAT  ✓ still holds
03. successCannotRegress            UNSAT  ✓ still holds
04. stockHandledEverywhere          UNSAT  ✓ still holds
05. networkTimeoutHandled           UNSAT  ✓ still holds
```

This is the *real* maintenance value: confidence that adding a feature didn't silently break a previously-verified property.

### New feature — 2 gaps found ✗

```
06. couponHandlesSessionExpiry      SAT    ✗ counterexample found
07. couponValidationHandlesTimeout  SAT    ✗ counterexample found
08. couponFlowExits                 UNSAT  ✓ flow correctly returns to Reviewing
```

---

## The 2 gaps in plain language

### Bug A — `CouponEntering` and `CouponValidating` don't handle session expiry

The user starts entering a coupon code, walks away from their desk, comes back 30 minutes later. Session has expired. Machine has no defined transition for `SESSION_EXPIRED` in these states.

In production: silent UI freeze, or worse, the coupon UI keeps accepting input from a session that's already invalid.

**Why it was missed**: cross-cutting concerns get forgotten when designers focus on the feature's happy path. They think about coupon-specific events (apply, submit, validate, invalid) and forget that the session/network regions still exist around them.

**Fix**: add `SESSION_EXPIRED -> SessionLost` to both states, matching every other safe state.

### Bug B — `CouponValidating` doesn't handle network timeout

Coupon validation involves a server call. If that call times out, the machine has no defined behavior — the user is stuck on a loading state forever.

In production: real bug that would ship and frustrate users.

**Why it was missed**: same reason — focus on the feature's logic, forget about infrastructure events.

**Fix**: add `NETWORK_TIMEOUT -> CouponInvalid` (with a network-specific error message) or route to a generic retry state.

---

## What this demonstrates about the workflow

1. **Adding a feature is a 15-minute round trip.** Modify the machine, modify the Alloy model, re-run. Alloy's verification time on this model: ~3 seconds.

2. **Previously-verified properties are protected.** All 6 original invariants survived the extension. If the designer had broken something — say, made the coupon flow somehow bypass payment — Alloy would have caught it.

3. **The new feature's gaps were caught before any code.** Bug B in particular (network timeout on coupon validation) is the kind of thing that ships, then a user reports it, then a sprint is spent reproducing and fixing. Here it surfaced before the first line of UI code was written.

4. **The pattern of "designer focuses on happy path, forgets cross-cutting concerns" is empirically real.** Both gaps are exactly that pattern. Verification systematizes catching it.
