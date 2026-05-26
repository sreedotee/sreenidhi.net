// Checkout + Gift Coupon — extended Alloy model
//
// Same model as 13-checkout-verified.als plus the three new coupon states.
// Re-runs the same verification properties from before, plus two new ones
// specifically for the coupon feature.
//
// Expectation: existing invariants should still hold (the extension didn't
// break the verified core). New invariants will catch designer gaps in the
// coupon insertion.

module checkoutCoupon

abstract sig State {
  next: Event -> State
}

one sig
  Cart, Reviewing, StockCheck, StockProblem,
  PaymentEntry, PaymentReady, Processing, ThreeDSecure,
  Declined, NetworkError, StockProblemDuringPayment,
  SessionLost, Success, Receipt,
  // NEW coupon states
  CouponEntering, CouponValidating, CouponInvalid
extends State {}

abstract sig Event {}
one sig
  EvReviewCart, EvEditCart, EvProceedToPayment, EvEnterPayment,
  EvBack, EvSubmitPayment, EvPaymentAuthorized, EvPaymentDeclined,
  EvPaymentRequires3DS, Ev3DSSuccess, Ev3DSFailed, Ev3DSCancelled,
  EvNetworkTimeout, EvRetry, EvStockOK, EvStockUnavailable, EvRemoveOOSItems,
  EvSessionExpired, EvResume, EvStartOver, EvViewReceipt,
  // NEW coupon events
  EvApplyCoupon, EvSubmitCoupon, EvCouponValid, EvCouponInvalid,
  EvRemoveCoupon, EvCancelCoupon, EvRetryCoupon
extends Event {}

fact Transitions {
  Cart.next = EvReviewCart -> Reviewing
            + EvSessionExpired -> SessionLost
            + EvResume -> Reviewing

  // CHANGED: Reviewing now handles coupon events
  Reviewing.next = EvEditCart -> Cart
                 + EvProceedToPayment -> StockCheck
                 + EvBack -> Cart
                 + EvSessionExpired -> SessionLost
                 + EvResume -> Reviewing
                 + EvApplyCoupon -> CouponEntering
                 + EvRemoveCoupon -> Reviewing  // self-loop, just an action

  StockCheck.next = EvStockOK -> PaymentEntry
                  + EvStockUnavailable -> StockProblem
                  + EvNetworkTimeout -> NetworkError
                  + EvSessionExpired -> SessionLost
                  + EvResume -> Reviewing

  StockProblem.next = EvRemoveOOSItems -> Reviewing
                    + EvBack -> Reviewing
                    + EvSessionExpired -> SessionLost
                    + EvResume -> Reviewing

  PaymentEntry.next = EvEnterPayment -> PaymentReady
                    + EvBack -> Reviewing
                    + EvStockUnavailable -> StockProblemDuringPayment
                    + EvSessionExpired -> SessionLost
                    + EvResume -> Reviewing

  PaymentReady.next = EvSubmitPayment -> Processing
                    + EvBack -> PaymentEntry
                    + EvStockUnavailable -> StockProblemDuringPayment
                    + EvSessionExpired -> SessionLost
                    + EvResume -> Reviewing

  Processing.next = EvPaymentAuthorized -> Success
                  + EvPaymentDeclined -> Declined
                  + EvPaymentRequires3DS -> ThreeDSecure
                  + EvNetworkTimeout -> NetworkError
                  + EvStockUnavailable -> StockProblemDuringPayment

  ThreeDSecure.next = Ev3DSSuccess -> Processing
                    + Ev3DSFailed -> Declined
                    + Ev3DSCancelled -> PaymentReady
                    + EvNetworkTimeout -> NetworkError
                    + EvStockUnavailable -> StockProblemDuringPayment

  Declined.next = EvEnterPayment -> PaymentReady
                + EvBack -> PaymentEntry
                + EvSessionExpired -> SessionLost
                + EvResume -> Reviewing

  NetworkError.next = EvRetry -> Processing
                    + EvBack -> PaymentReady
                    + EvNetworkTimeout -> NetworkError

  StockProblemDuringPayment.next = EvRemoveOOSItems -> Reviewing
                                 + EvBack -> Cart
                                 + EvSessionExpired -> SessionLost
                                 + EvResume -> Reviewing

  SessionLost.next = EvResume -> Reviewing
                   + EvStartOver -> Cart
                   + EvSessionExpired -> SessionLost

  Success.next = EvViewReceipt -> Receipt
               + EvStartOver -> Cart

  no Receipt.next

  // NEW STATES — these mirror what the .machine.js has (with the gaps)
  CouponEntering.next = EvSubmitCoupon -> CouponValidating
                      + EvCancelCoupon -> Reviewing
                      // NOTE: no SESSION_EXPIRED here — designer gap

  CouponValidating.next = EvCouponValid -> Reviewing
                        + EvCouponInvalid -> CouponInvalid
                        // NOTE: no NETWORK_TIMEOUT here — designer gap
                        // NOTE: no SESSION_EXPIRED here — designer gap

  CouponInvalid.next = EvRetryCoupon -> CouponEntering
                     + EvCancelCoupon -> Reviewing
                     + EvSessionExpired -> SessionLost
                     + EvResume -> Reviewing
}

// ---------- Helpers (unchanged) ----------
fun succ: State -> State {
  { s1, s2: State | some e: Event | s2 in s1.next[e] }
}
fun reachable: set State { Cart.*succ }
fun inFlight: set State { Processing + ThreeDSecure + NetworkError }
fun postSuccess: set State { Success + Receipt }

// ============================================================
// EXISTING PROPERTIES — should still hold under extension
// ============================================================

assert allStatesReachable {
  all s: State | s in reachable
}
check allStatesReachable for 17 State, 28 Event

assert noDeadlock {
  all s: State - Receipt | some s.next
}
check noDeadlock for 17 State, 28 Event

assert inFlightSurvivesSessionExpiry {
  all s: inFlight | s.next[EvSessionExpired] = none
}
check inFlightSurvivesSessionExpiry for 17 State, 28 Event

assert successCannotRegress {
  all s: postSuccess, e: Event - EvStartOver - EvViewReceipt |
    no s.next[e] or s.next[e] in postSuccess
}
check successCannotRegress for 17 State, 28 Event

assert stockHandledEverywhere {
  all s: (PaymentEntry + PaymentReady + Processing + ThreeDSecure) |
    some s.next[EvStockUnavailable]
}
check stockHandledEverywhere for 17 State, 28 Event

assert networkTimeoutHandled {
  all s: inFlight | some s.next[EvNetworkTimeout]
}
check networkTimeoutHandled for 17 State, 28 Event

// ============================================================
// NEW PROPERTIES — coupon flow must integrate cleanly
// ============================================================

// New "coupon-in-progress" set — analogous to in-flight payment
fun couponInProgress: set State { CouponEntering + CouponValidating }

// PROPERTY: every coupon state should handle session expiry
// (consistency with the rest of the safe states)
assert couponHandlesSessionExpiry {
  all s: couponInProgress | some s.next[EvSessionExpired]
}
check couponHandlesSessionExpiry for 17 State, 28 Event

// PROPERTY: coupon validation (server call) must handle network timeout
assert couponValidationHandlesTimeout {
  some CouponValidating.next[EvNetworkTimeout]
}
check couponValidationHandlesTimeout for 17 State, 28 Event

// PROPERTY: the coupon flow must reach back to Reviewing
assert couponFlowExits {
  all s: couponInProgress + CouponInvalid | Reviewing in s.*succ
}
check couponFlowExits for 17 State, 28 Event

// Run-style: confirm the coupon flow IS reachable from Cart
pred couponReachable {
  CouponEntering in Cart.*succ and
  CouponValidating in Cart.*succ and
  CouponInvalid in Cart.*succ
}
run couponReachable for 17 State, 28 Event
