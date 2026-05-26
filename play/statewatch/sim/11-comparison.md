# Comparison — Experiment A vs Experiment B

**Same designer brief.** Two different runs.

- **Experiment A** ([`06-experiment-a-direct.md`](06-experiment-a-direct.md)) — subagent given just the brief, asked to produce "a thoughtful checkout flow design." No mention of state machines or formal tools. This is what AI gives you today when a designer asks it to design something.
- **Experiment B** ([`07-experiment-b-machine.js`](07-experiment-b-machine.js)) — different subagent, same brief, but told the workflow constraint: output must be an XState v5 state machine and will be verified by Alloy. Then Alloy actually ran ([`08-experiment-b.als`](08-experiment-b.als), [`10-experiment-b-findings.md`](10-experiment-b-findings.md)).

Both subagents were Claude Opus 4.7, same model. Both runs took ~45–80 seconds.

---

## What each produced

### Experiment A

A 10-section design document (~1600 words). Contained:

- 3 design principles ("money moves once", "state survives reality", "tell the truth")
- 10 named screens (S1–S6 plus three error variants)
- An explicit user journey diagram (prose)
- A state model section with persistence layers (server session vs. localStorage)
- A 4-state machine: `DRAFT → SUBMITTING → SUCCEEDED / REQUIRES_ACTION / FAILED`
- A detailed idempotency contract using server-side dedupe keys
- 9 numbered edge-case handlers (declined card, 3DS, network failure, session expiry, stock conflicts, back navigation, double-click, two-tab, refresh)
- Per-screen state variables to track
- Component behavior notes for engineering
- Analytics hooks
- An out-of-scope list

This is a richer **design document** than I expected. It thought carefully about double-charge, idempotency keys, polling with backoff, the "in-flight is sacred" principle, the stock-conflict revalidation at two checkpoints.

### Experiment B

A single XState v5 file (~280 lines). Contained:

- 3 parallel regions: `session`, `network`, `flow`
- 13 explicit flow states
- 21 explicit events
- An `idempotencyKey` field in context with a mint/clear lifecycle
- A `paymentInFlight` boolean guard preventing double-submit at the state-machine level
- A `retryCount` with a `canRetry` guard capping retries at 3
- Explicit `stockCheck` and `stockProblem` states
- Explicit `networkError` state with retry guarded behavior
- A `sessionLost` recoverable state with `RESUME` / `START_OVER`

Less prose explanation but structurally explicit. Every transition is named. Every event is enumerable.

---

## What Alloy caught in B that A only claimed in prose

These are bugs Alloy mathematically proved exist in B's machine. **A's prose makes the same claims but has no enforcement.** Both runs probably have these bugs, but only B's are surfaced.

| # | Property | A's prose says | B's machine actually does | Alloy result |
|---|---|---|---|---|
| 1 | In-flight payment survives session expiry | "An in-flight order is sacred" (§6.4) | Processing/ThreeDSecure/NetworkError all transition to SessionLost on SESSION_EXPIRED | **SAT — bug confirmed** |
| 2 | Success state cannot regress | "Back button to checkout shows 'this order is complete'" (§6.6) | Success → SessionLost on SESSION_EXPIRED, Success → Reviewing on RESUME | **SAT — bug confirmed** |
| 3 | Stock conflicts handled in payment states | "Server re-validates one final time inside the same transaction" (§6.5) | STOCK_UNAVAILABLE not handled in any payment state | **SAT — bug confirmed** |
| 4 | NetworkError handles further timeouts | not addressed | NetworkError silent on NETWORK_TIMEOUT | **SAT — designer call** |
| 5 | Double-submit prevention | "Three layers of dedupe" (§6.7) | `notInFlight` guard on SUBMIT_PAYMENT | **UNSAT — invariant holds** |

The pattern: A's design *claims* robustness; B's machine *demonstrates* what's actually enforced. The four bugs are real and would ship.

---

## What A has that B doesn't

This is the honest other side.

- **Design rationale**. A explains *why* idempotency keys, *why* server-side dedupe, *why* polling with backoff. B's machine has those properties but doesn't justify them.
- **Persistence story**. A explicitly distinguishes server-session-persisted vs. localStorage-mirrored vs. never-persisted. B's machine has a context object but doesn't say what survives a refresh.
- **Cross-tab story**. A discusses BroadcastChannel for tab-to-tab sync. B's machine has no concept of multiple instances.
- **UI/UX guidance**. A names error screens, copy patterns, button states with specific names ("idle", "submitting", "locked-post-submit"). B is purely the state model.
- **Analytics hooks**. A enumerates events to emit for observability. B doesn't address it.
- **Implementation notes**. A talks about hosted card fields, debounced autocomplete, currency formatting. B is at a different level of abstraction.

If you handed an engineer only A, they could build something reasonable. If you handed them only B, they'd have an unambiguous state model but would have to fill in everything else.

---

## What B has that A doesn't

- **A queryable spec.** Alloy can ask questions of B's machine and get yes/no answers backed by a SAT solver. A's prose can only be re-read.
- **Mechanical completeness check.** B has 13 × 21 = 273 (state, event) pairs. 53 are handled, 220 are silent. The designer can review each silent pair against intent. A has no equivalent — its 4-state machine in §4.3 doesn't even enumerate possible events.
- **Mechanical idempotency check.** Alloy proved B's machine cannot fire SUBMIT_PAYMENT while in Processing. A's prose says three layers prevent it, but there's no machine-checkable claim.
- **Single source of truth.** B's machine is the code's state model directly. A's design has to be re-encoded by the engineer, with translation losses.

---

## Honest read

The naive framing was "FSM workflow catches what direct AI misses." The actual picture is more interesting:

- **A produced a thoughtful design** with most of the right ideas. The subagent, given no constraints, used its understanding of how checkout flows work to mention idempotency, polling, stock revalidation, the "in-flight is sacred" principle.
- **B produced a verifiable structure** that, when run through Alloy, surfaced four real bugs *in B's machine*. **A almost certainly has the same bugs**, but A has no mechanism to surface them. Either A is implemented faithfully and the bugs ship, or it isn't and the implementation diverges silently.

What this actually argues for is the **two-pass workflow**: use AI generation to produce a rich design like A, then translate the design into a state machine like B, then run formal verification. The handoff is the value, not either format alone.

This is the proposal Hillel Wayne, David Khourshid, and Erik Mogensen have been making in different shapes for ten years. The new piece — and the part that needs production validation, not just this experiment — is that **AI can plausibly do the translation step** between A's design and B's machine. That's the bridge that didn't exist before.

---

## What this experiment does NOT prove

- It does not prove A would ship bugs and B wouldn't. Both are AI outputs. Both could have any number of issues.
- It does not prove the workflow scales to a real codebase with hundreds of flows.
- It does not prove production teams want this. The experiment was a single brief, two subagent runs, one Alloy session.
- It does not prove AI is reliable enough as the translator between design and formal model. The translation could be lossy or wrong in subtle ways.

The experiment proves only this: when an AI is told to output a state machine and that machine is verified by Alloy, Alloy finds substantive bugs. When the AI is left unconstrained, no equivalent verification is possible against its output.

That's a real result. It's just smaller than "this is how everyone should design now."
