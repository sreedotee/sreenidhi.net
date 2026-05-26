// Checkout machine — coupon extension, post-fix
//
// Fixes applied based on Alloy findings from 16-checkout-with-coupon.als:
//
//   Bug A: CouponEntering and CouponValidating now handle SESSION_EXPIRED
//          (route to SessionLost, consistent with all other safe states)
//          Also added RESUME for consistency.
//
//   Bug B: CouponValidating now handles NETWORK_TIMEOUT
//          (routes to CouponInvalid with a network-flavored error message)

// Excerpted — only the coupon block changes from 15-checkout-with-coupon.machine.js

const fixedCouponBlock = {
  couponEntering: {
    on: {
      SUBMIT_COUPON: 'couponValidating',
      CANCEL_COUPON: 'reviewing',
      // Fix A
      SESSION_EXPIRED: 'sessionLost',
      RESUME: 'reviewing',
    },
  },

  couponValidating: {
    on: {
      COUPON_VALID: { target: 'reviewing', actions: 'applyCouponDiscount' },
      COUPON_INVALID: { target: 'couponInvalid', actions: 'recordCouponError' },
      // Fix A
      SESSION_EXPIRED: 'sessionLost',
      RESUME: 'reviewing',
      // Fix B
      NETWORK_TIMEOUT: { target: 'couponInvalid', actions: 'recordCouponNetworkError' },
    },
  },

  couponInvalid: {
    // unchanged — already had SESSION_EXPIRED and RESUME
    on: {
      RETRY_COUPON: 'couponEntering',
      CANCEL_COUPON: 'reviewing',
      SESSION_EXPIRED: 'sessionLost',
      RESUME: 'reviewing',
    },
  },
};

export default fixedCouponBlock;
