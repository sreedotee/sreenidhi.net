// Checkout machine — extended with gift coupon feature
//
// This simulates a designer adding a new feature to the already-verified
// checkout machine. The new flow:
//
//   Reviewing --APPLY_COUPON--> CouponEntering
//   CouponEntering --SUBMIT_COUPON--> CouponValidating
//   CouponValidating --COUPON_VALID--> Reviewing (discount applied)
//   CouponValidating --COUPON_INVALID--> CouponInvalid
//   CouponInvalid --RETRY--> CouponEntering
//   CouponInvalid --CANCEL_COUPON--> Reviewing
//   CouponEntering --CANCEL_COUPON--> Reviewing
//   Reviewing --REMOVE_COUPON--> Reviewing (just clears the discount)
//
// Some realistic gaps are deliberately present (the kind a designer focused
// on the happy path forgets). Alloy should catch them when re-verified.

import { setup, assign } from 'xstate';

const checkoutMachine = setup({
  // ... same setup as 12-checkout-verified.machine.js, with these additions:
  //
  // Context adds:
  //   - couponCode: string | null
  //   - couponDiscount: number
  //   - couponError: string | null
  //
  // Events add:
  //   APPLY_COUPON, SUBMIT_COUPON, COUPON_VALID, COUPON_INVALID,
  //   REMOVE_COUPON, CANCEL_COUPON, RETRY_COUPON
  //
  // Below is just the relevant additions/changes to .flow.states.

  // [setup() block omitted for brevity — see 12-checkout-verified.machine.js
  //  for the full setup; only the relevant new fields are listed in comments above]
}).createMachine({
  id: 'checkout',
  type: 'parallel',
  states: {
    // session and network regions unchanged

    flow: {
      initial: 'cart',
      states: {
        // Cart, StockCheck, StockProblem, PaymentEntry, PaymentReady,
        // Processing, ThreeDSecure, Declined, NetworkError,
        // StockProblemDuringPayment, SessionLost, Success, Receipt
        // are all unchanged from 12-checkout-verified.machine.js.

        reviewing: {
          on: {
            EDIT_CART: 'cart',
            PROCEED_TO_PAYMENT: 'stockCheck',
            BACK: 'cart',
            SESSION_EXPIRED: 'sessionLost',
            RESUME: 'reviewing',
            // NEW: gift coupon entry point
            APPLY_COUPON: 'couponEntering',
            // NEW: remove a previously-applied coupon (no state change needed)
            REMOVE_COUPON: { actions: 'clearCoupon' },
          },
        },

        // NEW STATE
        couponEntering: {
          on: {
            SUBMIT_COUPON: 'couponValidating',
            CANCEL_COUPON: 'reviewing',
            // GAP planted: forgot SESSION_EXPIRED
            // GAP planted: forgot BACK
          },
        },

        // NEW STATE
        couponValidating: {
          on: {
            COUPON_VALID: { target: 'reviewing', actions: 'applyCouponDiscount' },
            COUPON_INVALID: { target: 'couponInvalid', actions: 'recordCouponError' },
            // GAP planted: forgot NETWORK_TIMEOUT (real bug — validating coupon
            //              involves a server call that can time out)
            // GAP planted: forgot SESSION_EXPIRED
          },
        },

        // NEW STATE
        couponInvalid: {
          on: {
            RETRY_COUPON: 'couponEntering',
            CANCEL_COUPON: 'reviewing',
            SESSION_EXPIRED: 'sessionLost',
            RESUME: 'reviewing',
          },
        },
      },
    },
  },
});

export default checkoutMachine;
