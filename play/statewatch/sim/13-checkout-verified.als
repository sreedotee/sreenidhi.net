// Checkout machine — VERIFIED Alloy model
//
// Mirrors 12-checkout-verified.machine.js with all 4 fixes applied.
// Expectation: all 4 previously-failing assertions should now hold (UNSAT).

module checkoutV3

abstract sig State {
  next: Event -> State
}

one sig
  Cart, Reviewing, StockCheck, StockProblem,
  PaymentEntry, PaymentReady, Processing, ThreeDSecure,
  Declined, NetworkError, StockProblemDuringPayment,
  SessionLost, Success, Receipt
extends State {}

abstract sig Event {}
one sig
  EvReviewCart, EvEditCart, EvProceedToPayment, EvEnterPayment,
  EvBack, EvSubmitPayment, EvPaymentAuthorized, EvPaymentDeclined,
  EvPaymentRequires3DS, Ev3DSSuccess, Ev3DSFailed, Ev3DSCancelled,
  EvNetworkTimeout, EvRetry, EvStockOK, EvStockUnavailable, EvRemoveOOSItems,
  EvSessionExpired, EvResume, EvStartOver, EvViewReceipt
extends Event {}

fact Transitions {
  // Cart - safe state, accepts session events
  Cart.next = EvReviewCart -> Reviewing
            + EvSessionExpired -> SessionLost
            + EvResume -> Reviewing

  // Reviewing - safe state
  Reviewing.next = EvEditCart -> Cart
                 + EvProceedToPayment -> StockCheck
                 + EvBack -> Cart
                 + EvSessionExpired -> SessionLost
                 + EvResume -> Reviewing

  // StockCheck - safe state
  StockCheck.next = EvStockOK -> PaymentEntry
                  + EvStockUnavailable -> StockProblem
                  + EvNetworkTimeout -> NetworkError
                  + EvSessionExpired -> SessionLost
                  + EvResume -> Reviewing

  // StockProblem - safe state
  StockProblem.next = EvRemoveOOSItems -> Reviewing
                    + EvBack -> Reviewing
                    + EvSessionExpired -> SessionLost
                    + EvResume -> Reviewing

  // PaymentEntry - safe state, NOW handles stock
  PaymentEntry.next = EvEnterPayment -> PaymentReady
                    + EvBack -> Reviewing
                    + EvStockUnavailable -> StockProblemDuringPayment
                    + EvSessionExpired -> SessionLost
                    + EvResume -> Reviewing

  // PaymentReady - safe state, NOW handles stock
  PaymentReady.next = EvSubmitPayment -> Processing
                    + EvBack -> PaymentEntry
                    + EvStockUnavailable -> StockProblemDuringPayment
                    + EvSessionExpired -> SessionLost
                    + EvResume -> Reviewing

  // Processing - IN-FLIGHT, no session events, NOW handles stock
  Processing.next = EvPaymentAuthorized -> Success
                  + EvPaymentDeclined -> Declined
                  + EvPaymentRequires3DS -> ThreeDSecure
                  + EvNetworkTimeout -> NetworkError
                  + EvStockUnavailable -> StockProblemDuringPayment

  // ThreeDSecure - IN-FLIGHT, no session events, NOW handles stock
  ThreeDSecure.next = Ev3DSSuccess -> Processing
                    + Ev3DSFailed -> Declined
                    + Ev3DSCancelled -> PaymentReady
                    + EvNetworkTimeout -> NetworkError
                    + EvStockUnavailable -> StockProblemDuringPayment

  // Declined - safe state
  Declined.next = EvEnterPayment -> PaymentReady
                + EvBack -> PaymentEntry
                + EvSessionExpired -> SessionLost
                + EvResume -> Reviewing

  // NetworkError - IN-FLIGHT, no session events, NOW self-loops on timeout
  NetworkError.next = EvRetry -> Processing
                    + EvBack -> PaymentReady
                    + EvNetworkTimeout -> NetworkError

  // StockProblemDuringPayment - new state
  StockProblemDuringPayment.next = EvRemoveOOSItems -> Reviewing
                                 + EvBack -> Cart
                                 + EvSessionExpired -> SessionLost
                                 + EvResume -> Reviewing

  // SessionLost
  SessionLost.next = EvResume -> Reviewing
                   + EvStartOver -> Cart
                   + EvSessionExpired -> SessionLost

  // Success - POST-SUCCESS, cannot regress (no session events)
  Success.next = EvViewReceipt -> Receipt
               + EvStartOver -> Cart

  // Receipt - POST-SUCCESS, final, cannot regress (no transitions at all now)
  no Receipt.next
}

// ---------- Helpers ----------
fun succ: State -> State {
  { s1, s2: State | some e: Event | s2 in s1.next[e] }
}

fun reachable: set State { Cart.*succ }
fun inFlight: set State { Processing + ThreeDSecure + NetworkError }
fun postSuccess: set State { Success + Receipt }

// ============================================================
// All four properties should now hold
// ============================================================

assert allStatesReachable {
  all s: State | s in reachable
}
check allStatesReachable for 14 State, 21 Event

assert noDeadlock {
  // Receipt is final-only, exempt
  all s: State - Receipt | some s.next
}
check noDeadlock for 14 State, 21 Event

assert inFlightSurvivesSessionExpiry {
  all s: inFlight | s.next[EvSessionExpired] = none
}
check inFlightSurvivesSessionExpiry for 14 State, 21 Event

assert successCannotRegress {
  all s: postSuccess, e: Event - EvStartOver - EvViewReceipt |
    no s.next[e] or s.next[e] in postSuccess
}
check successCannotRegress for 14 State, 21 Event

assert stockHandledEverywhere {
  all s: (PaymentEntry + PaymentReady + Processing + ThreeDSecure) |
    some s.next[EvStockUnavailable]
}
check stockHandledEverywhere for 14 State, 21 Event

assert networkTimeoutHandled {
  all s: inFlight | some s.next[EvNetworkTimeout]
}
check networkTimeoutHandled for 14 State, 21 Event

// Idempotency still holds
pred submitDuringProcessing {
  some Processing.next[EvSubmitPayment]
}
run submitDuringProcessing for 14 State, 21 Event

// Confirm RESUME not accepted during Processing now
pred resumeDuringProcessing {
  some Processing.next[EvResume]
}
run resumeDuringProcessing for 14 State, 21 Event

// Confirm SESSION_EXPIRED not accepted at Success/Receipt now
pred sessionExpiryAfterSuccess {
  some Success.next[EvSessionExpired] or some Receipt.next[EvSessionExpired]
}
run sessionExpiryAfterSuccess for 14 State, 21 Event
