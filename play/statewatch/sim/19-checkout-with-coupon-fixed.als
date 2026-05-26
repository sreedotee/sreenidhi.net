// Checkout + Coupon, post-fix — Alloy model
// Same as 16-checkout-with-coupon.als with the coupon-state transitions
// updated to include SESSION_EXPIRED and NETWORK_TIMEOUT.

module checkoutCouponFixed

abstract sig State {
  next: Event -> State
}

one sig
  Cart, Reviewing, StockCheck, StockProblem,
  PaymentEntry, PaymentReady, Processing, ThreeDSecure,
  Declined, NetworkError, StockProblemDuringPayment,
  SessionLost, Success, Receipt,
  CouponEntering, CouponValidating, CouponInvalid
extends State {}

abstract sig Event {}
one sig
  EvReviewCart, EvEditCart, EvProceedToPayment, EvEnterPayment,
  EvBack, EvSubmitPayment, EvPaymentAuthorized, EvPaymentDeclined,
  EvPaymentRequires3DS, Ev3DSSuccess, Ev3DSFailed, Ev3DSCancelled,
  EvNetworkTimeout, EvRetry, EvStockOK, EvStockUnavailable, EvRemoveOOSItems,
  EvSessionExpired, EvResume, EvStartOver, EvViewReceipt,
  EvApplyCoupon, EvSubmitCoupon, EvCouponValid, EvCouponInvalid,
  EvRemoveCoupon, EvCancelCoupon, EvRetryCoupon
extends Event {}

fact Transitions {
  Cart.next = EvReviewCart -> Reviewing
            + EvSessionExpired -> SessionLost
            + EvResume -> Reviewing

  Reviewing.next = EvEditCart -> Cart
                 + EvProceedToPayment -> StockCheck
                 + EvBack -> Cart
                 + EvSessionExpired -> SessionLost
                 + EvResume -> Reviewing
                 + EvApplyCoupon -> CouponEntering
                 + EvRemoveCoupon -> Reviewing

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

  // FIXED coupon states
  CouponEntering.next = EvSubmitCoupon -> CouponValidating
                      + EvCancelCoupon -> Reviewing
                      + EvSessionExpired -> SessionLost      // Fix A
                      + EvResume -> Reviewing                // consistency

  CouponValidating.next = EvCouponValid -> Reviewing
                        + EvCouponInvalid -> CouponInvalid
                        + EvSessionExpired -> SessionLost     // Fix A
                        + EvResume -> Reviewing               // consistency
                        + EvNetworkTimeout -> CouponInvalid   // Fix B

  CouponInvalid.next = EvRetryCoupon -> CouponEntering
                     + EvCancelCoupon -> Reviewing
                     + EvSessionExpired -> SessionLost
                     + EvResume -> Reviewing
}

fun succ: State -> State {
  { s1, s2: State | some e: Event | s2 in s1.next[e] }
}
fun reachable: set State { Cart.*succ }
fun inFlight: set State { Processing + ThreeDSecure + NetworkError }
fun postSuccess: set State { Success + Receipt }
fun couponInProgress: set State { CouponEntering + CouponValidating }

// All previous checks
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

// Previously-failing assertions — should now hold
assert couponHandlesSessionExpiry {
  all s: couponInProgress | some s.next[EvSessionExpired]
}
check couponHandlesSessionExpiry for 17 State, 28 Event

assert couponValidationHandlesTimeout {
  some CouponValidating.next[EvNetworkTimeout]
}
check couponValidationHandlesTimeout for 17 State, 28 Event

assert couponFlowExits {
  all s: couponInProgress + CouponInvalid | Reviewing in s.*succ
}
check couponFlowExits for 17 State, 28 Event
