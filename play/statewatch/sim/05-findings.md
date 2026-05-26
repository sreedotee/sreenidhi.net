# Findings report — checkout state machine

**This is the AI's translation of the formal verification output back into designer-language.** The questions are the ones Alloy asks; the answers are what its solver returned.

Source files:
- Brief: `01-brief.md`
- XState machine (paste into Stately Studio to visualize): `02-checkout.machine.js`
- Alloy model: `03-checkout.als`
- Path enumeration: `04-paths.js`

---

## Verification properties — Alloy results

The Alloy run executed four `check` statements and two `run` statements. UNSAT for a `check` means "no counterexample exists — property holds." SAT for a `check` means "counterexample found — property fails."

```
00. check allStatesReachable          UNSAT   ✓ property holds
01. check noDeadlock                  UNSAT   ✓ property holds
02. check happyPathAlwaysReachable    UNSAT   ✓ property holds
03. check canAlwaysAbandon            SAT     ✗ counterexample found
04. run   trappedInDeclined           SAT     ✓ example exists
05. run   timeoutBlocksHappyPath      UNSAT   (no example)
```

### What each result means in designer-language

**✓ Every state is reachable.** No screen you defined is orphaned. Every one of the 12 states has at least one incoming path from the start.

**✓ No deadlocks.** Every non-terminal state has at least one way out. The user can't get permanently stuck in a state that has zero exits.

**✓ The happy path is always reachable.** From any non-terminal state, there exists *some* sequence of events that leads to Confirmation. The user can always, in principle, complete the purchase.

**✗ The user cannot always abandon.** Once the user enters the payment flow (`PaymentEntering`, `PaymentValidating`, `PaymentProcessing`, `PaymentThreeDS`, `PaymentDeclined`, `PaymentTimeout`), there is no path back to `CartEmpty`. They can only retry or succeed. The cart cannot be cleared from inside payment.

**✓ The "trapped in declined" example confirms the above.** Alloy found a specific instance: from `PaymentDeclined`, the only way out is `RETRY_PAYMENT`, which goes back to `PaymentEntering`. No abandon, no back-to-cart.

**(timeout is recoverable.)** From `PaymentTimeout`, retry → entering → validating → processing → confirmation is reachable. Timeout doesn't block the happy path.

---

## Path enumeration — `04-paths.js`

Counts distinct user journeys from `CartEmpty` to `Confirmation` with path length capped at 12 transitions.

```
Distinct paths (length ≤ 12):   125
Shortest happy path:            7 transitions
Longest valid path at depth 12: 12 transitions

Path-length distribution:
  7 transitions:   1 path
  8 transitions:   1 path
  9 transitions:   6 paths
  10 transitions: 10 paths
  11 transitions: 35 paths
  12 transitions: 72 paths

Of those 125 paths:
  21 route through PaymentThreeDS
   3 route through PaymentDeclined
   2 route through PaymentTimeout
```

**What this tells the designer:** the Figma file probably shows 4–5 screens. The actual graph the user navigates has at least 125 distinct ways to arrive at a successful order if we cap retry depth at 12 steps. Without a cap (infinite retries allowed), the number is unbounded.

---

## Issues flagged for designer review

Each issue is labeled with verifier confidence and a suggested category for the designer call.

### Issue 1 — `PaymentEntering` has no abandon route
- **Found by:** `canAlwaysAbandon` failed; `trappedInDeclined` instance.
- **What it means:** the user has typed in a card, has not submitted yet, decides "actually let me reconsider." There is no `BACK_TO_CART` transition defined. They have to close the tab.
- **Suggested label:** real bug — needs a `BACK_TO_CART` transition from `PaymentEntering`.

### Issue 2 — `PaymentDeclined` only offers retry
- **Found by:** `canAlwaysAbandon` failed; `trappedInDeclined` instance.
- **What it means:** card declined. The only event in this state is `RETRY_PAYMENT`. If the user wants to change their cart (maybe remove an expensive item) or use a different method, there's no path.
- **Suggested label:** real bug — needs at least one of: `BACK_TO_CART`, `CHANGE_PAYMENT_METHOD`, `ABANDON`.

### Issue 3 — `PaymentTimeout` only offers retry
- **Found by:** same as Issue 2.
- **What it means:** payment provider didn't respond in time. Only retry is offered. Same trap as declined.
- **Suggested label:** real bug — needs `BACK_TO_CART` or `ABANDON`.

### Issue 4 — `CartInventoryWarning` ignores last-item case
- **Found by:** code review during model authoring (Alloy didn't catch this because guards aren't in the .als model).
- **What it means:** in `cart.hasItems`, `REMOVE_ITEM` correctly routes to `empty` if it's the last item (via `lastItem` guard). In `cart.inventoryWarning`, `REMOVE_ITEM` always routes to `hasItems`. If the user removes the last item from the warning state, they're in `hasItems` with zero items. Impossible state.
- **Suggested label:** real bug — apply the same `lastItem` guard inside `inventoryWarning`.

### Issue 5 — `Confirmation` is terminal with no reset
- **Found by:** code review (Alloy confirms `Confirmation.next = none` is intentional).
- **What it means:** order placed. To buy something else, user has to refresh the app. No `START_NEW_ORDER` event.
- **Suggested label:** **designer call** — this might be intentional (a celebration screen with a separate "shop more" button on the next page) or a bug (user can't continue). Decision needed.

### Issue 6 — Orthogonal regions not modeled in Alloy
- **Found by:** scope decision during model authoring.
- **What it means:** the `session` and `network` orthogonal regions exist in the XState machine but were not encoded in the Alloy model. So Alloy did not verify, for example, "what happens if `SESSION_EXPIRED` fires while the user is in `PaymentProcessing`?" The XState model also doesn't handle it — `PaymentProcessing` has no `SESSION_EXPIRED` transition.
- **Suggested label:** **scope expansion needed** — either model the parallel regions in Alloy too, or add cross-region event handling to the XState machine and re-verify.

---

## What the verification did not check

Honest list of what's *not* in this report:

1. **Event completeness** — "does every state handle every event the user could send?" The Alloy model treats transitions as state-to-state, not state × event → state. To check completeness, the model needs to be expanded to include events as a sig. This is doable but adds ~50 lines.
2. **Race conditions** — e.g. user double-clicks Submit during `PaymentValidating`. Modeling this requires expressing concurrency, which Alloy can do but isn't in this first pass.
3. **Real-money invariants** — "the user is never charged twice." This requires modeling side-effects, which Alloy is capable of but again wasn't in this pass.
4. **Inventory races** — `INVENTORY_CHANGED` is handled in the cart, but what if it fires *during* `PaymentProcessing`? Not modeled.

These are real next steps, not failures of the technique.

---

## Awaiting designer review

The next step in the workflow is the **designer review**: for each issue above, decide whether to (a) accept the fix, (b) reject and document why the gap is intentional, or (c) ask for more information.

This report stops here. UI variant generation is downstream of designer approval of the verified model.
