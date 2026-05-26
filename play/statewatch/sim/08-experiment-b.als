// Experiment B — Alloy model with events explicitly modeled
//
// Encodes the flow region of the subagent's XState machine (07-experiment-b-machine.js).
// Events are first-class sigs. The transition relation is State -> Event -> State,
// which lets us check completeness (for each state, which events have no transition?)
// in addition to reachability / deadlock-freedom.
//
// Run: java -jar alloy.jar exec 08-experiment-b.als

module checkoutV2

// ---------- States ----------
abstract sig State {
  next: Event -> State
}

one sig
  Cart, Reviewing, StockCheck, StockProblem,
  PaymentEntry, PaymentReady, Processing, ThreeDSecure,
  Declined, NetworkError, SessionLost, Success, Receipt
extends State {}

// ---------- Events ----------
abstract sig Event {}
one sig
  EvReviewCart, EvEditCart, EvProceedToPayment, EvEnterPayment,
  EvBack, EvSubmitPayment, EvPaymentAuthorized, EvPaymentDeclined,
  EvPaymentRequires3DS, Ev3DSSuccess, Ev3DSFailed, Ev3DSCancelled,
  EvNetworkTimeout, EvRetry, EvStockOK, EvStockUnavailable, EvRemoveOOSItems,
  EvSessionExpired, EvResume, EvStartOver, EvViewReceipt
extends Event {}

// ---------- Transition table (mirrors 07-experiment-b-machine.js) ----------
fact Transitions {
  // Cart
  Cart.next = EvReviewCart -> Reviewing
            + EvSessionExpired -> SessionLost
            + EvResume -> Reviewing

  // Reviewing
  Reviewing.next = EvEditCart -> Cart
                 + EvProceedToPayment -> StockCheck
                 + EvBack -> Cart
                 + EvSessionExpired -> SessionLost
                 + EvResume -> Reviewing

  // StockCheck
  StockCheck.next = EvStockOK -> PaymentEntry
                  + EvStockUnavailable -> StockProblem
                  + EvNetworkTimeout -> NetworkError
                  + EvSessionExpired -> SessionLost
                  + EvResume -> Reviewing

  // StockProblem
  StockProblem.next = EvRemoveOOSItems -> Reviewing
                    + EvBack -> Reviewing
                    + EvSessionExpired -> SessionLost
                    + EvResume -> Reviewing

  // PaymentEntry
  PaymentEntry.next = EvEnterPayment -> PaymentReady
                    + EvBack -> Reviewing
                    + EvSessionExpired -> SessionLost
                    + EvResume -> Reviewing

  // PaymentReady
  PaymentReady.next = EvSubmitPayment -> Processing
                    + EvBack -> PaymentEntry
                    + EvSessionExpired -> SessionLost
                    + EvResume -> Reviewing

  // Processing — note SESSION_EXPIRED and RESUME both inherited from flow parent
  Processing.next = EvPaymentAuthorized -> Success
                  + EvPaymentDeclined -> Declined
                  + EvPaymentRequires3DS -> ThreeDSecure
                  + EvNetworkTimeout -> NetworkError
                  + EvSessionExpired -> SessionLost
                  + EvResume -> Reviewing

  // ThreeDSecure
  ThreeDSecure.next = Ev3DSSuccess -> Processing
                    + Ev3DSFailed -> Declined
                    + Ev3DSCancelled -> PaymentReady
                    + EvNetworkTimeout -> NetworkError
                    + EvSessionExpired -> SessionLost
                    + EvResume -> Reviewing

  // Declined
  Declined.next = EvEnterPayment -> PaymentReady
                + EvBack -> PaymentEntry
                + EvSessionExpired -> SessionLost
                + EvResume -> Reviewing

  // NetworkError
  NetworkError.next = EvRetry -> Processing
                    + EvBack -> PaymentReady
                    + EvSessionExpired -> SessionLost
                    + EvResume -> Reviewing

  // SessionLost
  SessionLost.next = EvResume -> Reviewing
                   + EvStartOver -> Cart
                   + EvSessionExpired -> SessionLost

  // Success
  Success.next = EvViewReceipt -> Receipt
               + EvStartOver -> Cart
               + EvSessionExpired -> SessionLost
               + EvResume -> Reviewing

  // Receipt (final, but parent-level transitions still fire)
  Receipt.next = EvSessionExpired -> SessionLost
}

// ---------- Helpers ----------
pred handles[s: State, e: Event] {
  some s.next[e]
}

// State-to-state successor relation (ignores which event)
fun succ: State -> State {
  { s1, s2: State | some e: Event | s2 in s1.next[e] }
}

fun reachable: set State {
  Cart.*succ
}

// Helper: a state is "in-flight" — payment has been submitted, not yet resolved
fun inFlight: set State { Processing + ThreeDSecure + NetworkError }

// Helper: a state is "post-success" — order is done
fun postSuccess: set State { Success + Receipt }

// ============================================================
// PROPERTY 1: every state is reachable from Cart
// ============================================================
assert allStatesReachable {
  all s: State | s in reachable
}
check allStatesReachable for 13 State, 21 Event

// ============================================================
// PROPERTY 2: no deadlock — every state has at least one outgoing transition
// ============================================================
assert noDeadlock {
  all s: State | some s.next
}
check noDeadlock for 13 State, 21 Event

// ============================================================
// PROPERTY 3: in-flight payments survive session expiry
// "An in-flight order is sacred." A SESSION_EXPIRED event in Processing /
// ThreeDSecure / NetworkError should NOT drop the user to SessionLost.
// ============================================================
assert inFlightSurvivesSessionExpiry {
  all s: inFlight | s.next[EvSessionExpired] = none
}
check inFlightSurvivesSessionExpiry for 13 State, 21 Event

// ============================================================
// PROPERTY 4: post-success states cannot regress
// Once you reach Success or Receipt, no event should drop you back into
// the checkout flow (other than a deliberate START_OVER).
// ============================================================
assert successCannotRegress {
  all s: postSuccess, e: Event - EvStartOver - EvViewReceipt |
    no s.next[e] or s.next[e] in postSuccess
}
check successCannotRegress for 13 State, 21 Event

// ============================================================
// PROPERTY 5: STOCK_UNAVAILABLE handled wherever a payment could be triggered
// If stock can change at any time, every pre-payment-commit state should
// handle it. (Designer might decide otherwise — this surfaces the question.)
// ============================================================
assert stockHandledEverywhere {
  all s: (PaymentEntry + PaymentReady + Processing + ThreeDSecure) |
    some s.next[EvStockUnavailable]
}
check stockHandledEverywhere for 13 State, 21 Event

// ============================================================
// PROPERTY 6: NETWORK_TIMEOUT handled in every committed-but-pending state
// ============================================================
assert networkTimeoutHandled {
  all s: inFlight | some s.next[EvNetworkTimeout]
}
check networkTimeoutHandled for 13 State, 21 Event

// ============================================================
// PROPERTY 7: completeness — for every reachable state, every event is
// either handled or explicitly silent. We surface UNhandled (state, event)
// pairs by counting; the designer reviews them case by case.
// ============================================================
// Find any (state, event) pair where the event has no transition.
// This isn't a "fail" — it's a list of design questions.
pred silentPair[s: State, e: Event] {
  no s.next[e]
}
run silentPair for 13 State, 21 Event expect 1

// ============================================================
// Specific dangerous-silence checks (each is a known-or-suspected gap)
// ============================================================

// Q: can SUBMIT_PAYMENT fire in Processing? It SHOULDN'T (idempotency).
pred submitDuringProcessing {
  some Processing.next[EvSubmitPayment]
}
run submitDuringProcessing for 13 State, 21 Event

// Q: is RESUME accepted in Processing? It SHOULDN'T be (in-flight is sacred).
pred resumeDuringProcessing {
  some Processing.next[EvResume]
}
run resumeDuringProcessing for 13 State, 21 Event

// Q: is SESSION_EXPIRED accepted in Success/Receipt? It shouldn't matter.
pred sessionExpiryAfterSuccess {
  some Success.next[EvSessionExpired] or some Receipt.next[EvSessionExpired]
}
run sessionExpiryAfterSuccess for 13 State, 21 Event
