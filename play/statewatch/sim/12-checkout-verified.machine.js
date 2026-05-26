// Checkout machine — VERIFIED version
//
// All 4 fixes from designer review applied:
//
// Fix 1: SESSION_EXPIRED and RESUME removed from `flow` parent.
//        Defined per-state, EXCLUDING Processing, ThreeDSecure, NetworkError.
//        In-flight payments are now sacred.
//
// Fix 2: Success and Receipt no longer accept SESSION_EXPIRED or RESUME.
//        Post-success states cannot regress.
//
// Fix 3: New state StockProblemDuringPayment. Reachable from PaymentEntry,
//        PaymentReady, Processing, ThreeDSecure on STOCK_UNAVAILABLE.
//
// Fix 4: NetworkError self-loops on NETWORK_TIMEOUT with retry counter bump.

import { setup, assign } from 'xstate';

const checkoutMachine = setup({
  types: {
    context: {} as {
      cart: Array<{ sku: string; qty: number; price: number }>;
      outOfStockSkus: string[];
      payment: { last4?: string; brand?: string; token?: string } | null;
      idempotencyKey: string | null;
      paymentInFlight: boolean;
      orderId: string | null;
      declineReason: string | null;
      threeDSUrl: string | null;
      sessionExpiresAt: number | null;
      retryCount: number;
      timeoutCount: number;
    },
    events: {} as
      | { type: 'REVIEW_CART' }
      | { type: 'EDIT_CART' }
      | { type: 'PROCEED_TO_PAYMENT' }
      | { type: 'ENTER_PAYMENT'; payment: { last4: string; brand: string; token: string } }
      | { type: 'BACK' }
      | { type: 'SUBMIT_PAYMENT' }
      | { type: 'PAYMENT_AUTHORIZED'; orderId: string }
      | { type: 'PAYMENT_DECLINED'; reason: string }
      | { type: 'PAYMENT_REQUIRES_3DS'; url: string }
      | { type: '3DS_SUCCESS' }
      | { type: '3DS_FAILED' }
      | { type: '3DS_CANCELLED' }
      | { type: 'NETWORK_TIMEOUT' }
      | { type: 'NETWORK_ONLINE' }
      | { type: 'NETWORK_OFFLINE' }
      | { type: 'RETRY' }
      | { type: 'STOCK_OK' }
      | { type: 'STOCK_UNAVAILABLE'; skus: string[] }
      | { type: 'REMOVE_OOS_ITEMS' }
      | { type: 'SESSION_TICK'; now: number }
      | { type: 'SESSION_EXTEND'; expiresAt: number }
      | { type: 'SESSION_EXPIRED' }
      | { type: 'RESUME'; snapshot: unknown }
      | { type: 'START_OVER' }
      | { type: 'VIEW_RECEIPT' }
  },
  guards: {
    hasItems: ({ context }) => context.cart.length > 0,
    notInFlight: ({ context }) => !context.paymentInFlight,
    canRetry: ({ context }) => context.retryCount < 3,
  },
  actions: {
    setPayment: assign({
      payment: ({ event }) => (event.type === 'ENTER_PAYMENT' ? event.payment : null),
    }),
    mintIdempotencyKey: assign({
      idempotencyKey: ({ context }) =>
        context.idempotencyKey ?? `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    }),
    clearIdempotencyKey: assign({ idempotencyKey: () => null, retryCount: () => 0 }),
    markInFlight: assign({ paymentInFlight: () => true }),
    clearInFlight: assign({ paymentInFlight: () => false }),
    recordOrder: assign({
      orderId: ({ event }) => (event.type === 'PAYMENT_AUTHORIZED' ? event.orderId : null),
    }),
    recordDecline: assign({
      declineReason: ({ event }) => (event.type === 'PAYMENT_DECLINED' ? event.reason : null),
    }),
    record3DS: assign({
      threeDSUrl: ({ event }) => (event.type === 'PAYMENT_REQUIRES_3DS' ? event.url : null),
    }),
    recordOOS: assign({
      outOfStockSkus: ({ event }) => (event.type === 'STOCK_UNAVAILABLE' ? event.skus : []),
    }),
    clearOOS: assign({ outOfStockSkus: () => [] }),
    removeOOSFromCart: assign({
      cart: ({ context }) => context.cart.filter((i) => !context.outOfStockSkus.includes(i.sku)),
      outOfStockSkus: () => [],
    }),
    bumpRetry: assign({ retryCount: ({ context }) => context.retryCount + 1 }),
    bumpTimeoutCount: assign({ timeoutCount: ({ context }) => context.timeoutCount + 1 }),
    extendSession: assign({
      sessionExpiresAt: ({ event }) =>
        event.type === 'SESSION_EXTEND' ? event.expiresAt : null,
    }),
  },
}).createMachine({
  id: 'checkout',
  type: 'parallel',
  context: {
    cart: [],
    outOfStockSkus: [],
    payment: null,
    idempotencyKey: null,
    paymentInFlight: false,
    orderId: null,
    declineReason: null,
    threeDSUrl: null,
    sessionExpiresAt: null,
    retryCount: 0,
    timeoutCount: 0,
  },
  states: {
    session: {
      initial: 'active',
      states: {
        active: {
          on: {
            SESSION_TICK: { guard: ({ context, event }) =>
              context.sessionExpiresAt !== null && event.now >= context.sessionExpiresAt,
              target: 'expired' },
            SESSION_EXTEND: { actions: 'extendSession' },
          },
        },
        expired: { on: { RESUME: { target: 'active', actions: 'extendSession' } } },
      },
    },
    network: {
      initial: 'online',
      states: {
        online: { on: { NETWORK_OFFLINE: 'offline' } },
        offline: { on: { NETWORK_ONLINE: 'online' } },
      },
    },
    flow: {
      // NOTE: SESSION_EXPIRED and RESUME are NO LONGER at the parent level.
      // They are defined per-state below, deliberately EXCLUDING the
      // in-flight states (Processing, ThreeDSecure, NetworkError) and the
      // post-success states (Success, Receipt).
      initial: 'cart',
      states: {
        cart: {
          on: {
            REVIEW_CART: { target: 'reviewing', guard: 'hasItems' },
            SESSION_EXPIRED: 'sessionLost',
            RESUME: 'reviewing',
          },
        },
        reviewing: {
          on: {
            EDIT_CART: 'cart',
            PROCEED_TO_PAYMENT: 'stockCheck',
            BACK: 'cart',
            SESSION_EXPIRED: 'sessionLost',
            RESUME: 'reviewing',
          },
        },
        stockCheck: {
          entry: 'clearOOS',
          on: {
            STOCK_OK: 'paymentEntry',
            STOCK_UNAVAILABLE: { target: 'stockProblem', actions: 'recordOOS' },
            NETWORK_TIMEOUT: 'networkError',
            SESSION_EXPIRED: 'sessionLost',
            RESUME: 'reviewing',
          },
        },
        stockProblem: {
          on: {
            REMOVE_OOS_ITEMS: [
              { target: 'reviewing', guard: 'hasItems', actions: 'removeOOSFromCart' },
              { target: 'cart', actions: 'removeOOSFromCart' },
            ],
            BACK: 'reviewing',
            SESSION_EXPIRED: 'sessionLost',
            RESUME: 'reviewing',
          },
        },
        paymentEntry: {
          on: {
            ENTER_PAYMENT: { target: 'paymentReady', actions: 'setPayment' },
            BACK: 'reviewing',
            // Fix 3: stock issue mid-payment-entry routes to dedicated state
            STOCK_UNAVAILABLE: { target: 'stockProblemDuringPayment', actions: 'recordOOS' },
            SESSION_EXPIRED: 'sessionLost',
            RESUME: 'reviewing',
          },
        },
        paymentReady: {
          on: {
            SUBMIT_PAYMENT: {
              target: 'processing',
              guard: 'notInFlight',
              actions: ['mintIdempotencyKey', 'markInFlight'],
            },
            BACK: 'paymentEntry',
            // Fix 3: stock issue before submit routes to dedicated state
            STOCK_UNAVAILABLE: { target: 'stockProblemDuringPayment', actions: 'recordOOS' },
            SESSION_EXPIRED: 'sessionLost',
            RESUME: 'reviewing',
          },
        },
        // Fix 1: NO SESSION_EXPIRED / RESUME — in-flight is sacred
        processing: {
          on: {
            PAYMENT_AUTHORIZED: {
              target: 'success',
              actions: ['recordOrder', 'clearInFlight', 'clearIdempotencyKey'],
            },
            PAYMENT_DECLINED: {
              target: 'declined',
              actions: ['recordDecline', 'clearInFlight'],
            },
            PAYMENT_REQUIRES_3DS: { target: 'threeDSecure', actions: 'record3DS' },
            NETWORK_TIMEOUT: { target: 'networkError', actions: 'clearInFlight' },
            // Fix 3: stock issue during processing routes to dedicated state
            STOCK_UNAVAILABLE: {
              target: 'stockProblemDuringPayment',
              actions: ['recordOOS', 'clearInFlight'],
            },
            SUBMIT_PAYMENT: { guard: () => false }, // idempotency
          },
        },
        // Fix 1: NO SESSION_EXPIRED / RESUME — in-flight is sacred
        threeDSecure: {
          on: {
            '3DS_SUCCESS': 'processing',
            '3DS_FAILED': { target: 'declined', actions: ['recordDecline', 'clearInFlight'] },
            '3DS_CANCELLED': { target: 'paymentReady', actions: 'clearInFlight' },
            NETWORK_TIMEOUT: { target: 'networkError', actions: 'clearInFlight' },
            STOCK_UNAVAILABLE: {
              target: 'stockProblemDuringPayment',
              actions: ['recordOOS', 'clearInFlight'],
            },
          },
        },
        declined: {
          on: {
            ENTER_PAYMENT: {
              target: 'paymentReady',
              actions: ['setPayment', 'clearIdempotencyKey'],
            },
            BACK: { target: 'paymentEntry', actions: 'clearIdempotencyKey' },
            SESSION_EXPIRED: 'sessionLost',
            RESUME: 'reviewing',
          },
        },
        // Fix 1: NO SESSION_EXPIRED / RESUME
        // Fix 4: self-loop on NETWORK_TIMEOUT with retry counter bump
        networkError: {
          on: {
            RETRY: [
              {
                target: 'processing',
                guard: 'canRetry',
                actions: ['bumpRetry', 'markInFlight'],
              },
              { target: 'paymentReady' },
            ],
            BACK: { target: 'paymentReady', actions: 'clearIdempotencyKey' },
            // Fix 4: another timeout while in error → stay here, bump counter
            NETWORK_TIMEOUT: { target: 'networkError', actions: 'bumpTimeoutCount' },
          },
        },
        // Fix 3: new state
        stockProblemDuringPayment: {
          on: {
            REMOVE_OOS_ITEMS: [
              { target: 'reviewing', guard: 'hasItems', actions: 'removeOOSFromCart' },
              { target: 'cart', actions: 'removeOOSFromCart' },
            ],
            BACK: { target: 'cart', actions: 'clearIdempotencyKey' },
            SESSION_EXPIRED: 'sessionLost',
            RESUME: 'reviewing',
          },
        },
        sessionLost: {
          on: {
            RESUME: { target: 'reviewing', actions: 'extendSession' },
            START_OVER: { target: 'cart', actions: 'clearIdempotencyKey' },
            SESSION_EXPIRED: 'sessionLost',
          },
        },
        // Fix 2: NO SESSION_EXPIRED / RESUME — cannot regress
        success: {
          on: { VIEW_RECEIPT: 'receipt', START_OVER: 'cart' },
        },
        // Fix 2: NO SESSION_EXPIRED / RESUME — cannot regress
        receipt: { type: 'final' },
      },
    },
  },
});

export default checkoutMachine;
