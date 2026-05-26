// Experiment B — XState v5 machine produced by subagent
//
// Setup: a separate subagent was spawned with the same brief from 01-brief.md,
// but with the workflow constraint that "output must be an XState v5 machine,
// will be verified by Alloy."
//
// Subagent: general-purpose, Claude Opus 4.7, no tool access, no workspace access.
// Output below is verbatim from the subagent. No edits.

import { setup, createMachine, assign } from 'xstate';

// E-commerce checkout machine
// - Parallel top-level regions: session (TTL), network (connectivity), and flow (main checkout).
// - Hierarchical states inside `flow` model the linear user journey with explicit error branches.
// - Idempotency is enforced by guarding `SUBMIT_PAYMENT` on `paymentInFlight` and using a
//   client-generated `idempotencyKey` that survives retries.
// - Refresh-safety: every persistent slice lives in context so a host can rehydrate it.
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
      | { type: 'STOCK_CHECK' }
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
    hasPayment: ({ context }) => context.payment !== null,
    notInFlight: ({ context }) => !context.paymentInFlight,
    sessionExpired: ({ context, event }) =>
      event.type === 'SESSION_TICK' &&
      context.sessionExpiresAt !== null &&
      event.now >= context.sessionExpiresAt,
    hasOOS: ({ context }) => context.outOfStockSkus.length > 0,
    canRetry: ({ context }) => context.retryCount < 3,
  },
  actions: {
    setPayment: assign({
      payment: ({ event }) => (event.type === 'ENTER_PAYMENT' ? event.payment : null),
    }),
    mintIdempotencyKey: assign({
      // Stable across retries of the same submission; rotated on a fresh attempt.
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
  },
  states: {
    session: {
      initial: 'active',
      states: {
        active: {
          on: {
            SESSION_TICK: { guard: 'sessionExpired', target: 'expired' },
            SESSION_EXTEND: { actions: 'extendSession' },
          },
        },
        expired: {
          on: { RESUME: { target: 'active', actions: 'extendSession' } },
        },
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
      initial: 'cart',
      on: {
        SESSION_EXPIRED: '.sessionLost',
        RESUME: { target: '.reviewing', actions: 'extendSession' },
      },
      states: {
        cart: {
          on: { REVIEW_CART: { target: 'reviewing', guard: 'hasItems' } },
        },
        reviewing: {
          on: {
            EDIT_CART: 'cart',
            PROCEED_TO_PAYMENT: 'stockCheck',
            BACK: 'cart',
          },
        },
        stockCheck: {
          entry: 'clearOOS',
          on: {
            STOCK_OK: 'paymentEntry',
            STOCK_UNAVAILABLE: { target: 'stockProblem', actions: 'recordOOS' },
            NETWORK_TIMEOUT: 'networkError',
          },
        },
        stockProblem: {
          on: {
            REMOVE_OOS_ITEMS: [
              { target: 'reviewing', guard: 'hasItems', actions: 'removeOOSFromCart' },
              { target: 'cart', actions: 'removeOOSFromCart' },
            ],
            BACK: 'reviewing',
          },
        },
        paymentEntry: {
          on: {
            ENTER_PAYMENT: { target: 'paymentReady', actions: 'setPayment' },
            BACK: 'reviewing',
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
          },
        },
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
            SUBMIT_PAYMENT: { guard: () => false },
          },
        },
        threeDSecure: {
          on: {
            '3DS_SUCCESS': 'processing',
            '3DS_FAILED': { target: 'declined', actions: ['recordDecline', 'clearInFlight'] },
            '3DS_CANCELLED': { target: 'paymentReady', actions: 'clearInFlight' },
            NETWORK_TIMEOUT: { target: 'networkError', actions: 'clearInFlight' },
          },
        },
        declined: {
          on: {
            ENTER_PAYMENT: {
              target: 'paymentReady',
              actions: ['setPayment', 'clearIdempotencyKey'],
            },
            BACK: { target: 'paymentEntry', actions: 'clearIdempotencyKey' },
          },
        },
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
          },
        },
        sessionLost: {
          on: {
            RESUME: { target: 'reviewing', actions: 'extendSession' },
            START_OVER: { target: 'cart', actions: 'clearIdempotencyKey' },
          },
        },
        success: {
          on: { VIEW_RECEIPT: 'receipt', START_OVER: 'cart' },
        },
        receipt: { type: 'final' },
      },
    },
  },
});

export default checkoutMachine;
