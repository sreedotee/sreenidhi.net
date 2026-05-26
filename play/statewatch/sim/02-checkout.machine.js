// Checkout state machine — XState v5
//
// This is the AI's first translation of the designer-intent brief.
// It's a plausible first draft that ALSO contains the kinds of gaps a
// designer leaves on a first pass. The verification step (Alloy) catches
// them.
//
// Paste this into stately.ai/registry to visualize.
// https://stately.ai/registry

import { setup, assign } from 'xstate';

export const checkoutMachine = setup({
  types: {
    context: {} as { items: number; declineReason: string | null },
    events: {} as
      | { type: 'ADD_ITEM' }
      | { type: 'REMOVE_ITEM' }
      | { type: 'PROCEED_TO_REVIEW' }
      | { type: 'BACK_TO_CART' }
      | { type: 'CONFIRM_REVIEW' }
      | { type: 'ENTER_CARD' }
      | { type: 'SUBMIT_PAYMENT' }
      | { type: 'CARD_INVALID' }
      | { type: 'CARD_VALID' }
      | { type: 'THREE_DS_REQUIRED' }
      | { type: 'THREE_DS_PASSED' }
      | { type: 'THREE_DS_FAILED' }
      | { type: 'THREE_DS_CANCELLED' }
      | { type: 'PAYMENT_DECLINED' }
      | { type: 'PAYMENT_SUCCESS' }
      | { type: 'PAYMENT_TIMEOUT' }
      | { type: 'RETRY_PAYMENT' }
      | { type: 'SESSION_WARNING' }
      | { type: 'SESSION_EXPIRED' }
      | { type: 'SESSION_EXTENDED' }
      | { type: 'NETWORK_OFFLINE' }
      | { type: 'NETWORK_ONLINE' }
      | { type: 'INVENTORY_CHANGED' }
      | { type: 'RESET' },
  },
  guards: {
    lastItem: ({ context }) => context.items === 1,
  },
}).createMachine({
  id: 'checkout',
  type: 'parallel',
  context: { items: 0, declineReason: null },
  states: {
    // --- Session region (orthogonal) ---
    session: {
      initial: 'active',
      states: {
        active: { on: { SESSION_WARNING: 'expiring' } },
        expiring: {
          on: {
            SESSION_EXTENDED: 'active',
            SESSION_EXPIRED: 'expired',
          },
        },
        expired: { type: 'final' },
      },
    },

    // --- Network region (orthogonal) ---
    network: {
      initial: 'online',
      states: {
        online: { on: { NETWORK_OFFLINE: 'offline' } },
        offline: { on: { NETWORK_ONLINE: 'online' } },
      },
    },

    // --- Main flow region ---
    flow: {
      initial: 'cart',
      states: {
        cart: {
          initial: 'empty',
          states: {
            empty: {
              on: { ADD_ITEM: 'hasItems' },
            },
            hasItems: {
              on: {
                ADD_ITEM: 'hasItems',
                REMOVE_ITEM: [
                  { target: 'empty', guard: 'lastItem' },
                  { target: 'hasItems' },
                ],
                PROCEED_TO_REVIEW: '#checkout.flow.review',
                INVENTORY_CHANGED: 'inventoryWarning',
              },
            },
            inventoryWarning: {
              // GAP 1: REMOVE_ITEM goes to hasItems even if it was the last item.
              // The lastItem guard isn't applied here. Designer forgot.
              on: {
                REMOVE_ITEM: 'hasItems',
                ADD_ITEM: 'hasItems',
              },
            },
          },
        },

        review: {
          on: {
            BACK_TO_CART: 'cart.hasItems',
            CONFIRM_REVIEW: 'payment',
            INVENTORY_CHANGED: 'cart.inventoryWarning',
          },
        },

        payment: {
          initial: 'methodSelection',
          states: {
            methodSelection: {
              on: { ENTER_CARD: 'entering' },
            },
            entering: {
              on: {
                SUBMIT_PAYMENT: 'validating',
                // GAP 2: No BACK_TO_CART from entering. User is trapped
                // in payment once they start.
              },
            },
            validating: {
              on: {
                CARD_INVALID: 'entering',
                CARD_VALID: 'processing',
              },
            },
            processing: {
              on: {
                THREE_DS_REQUIRED: 'threeDS',
                PAYMENT_DECLINED: 'declined',
                PAYMENT_SUCCESS: '#checkout.flow.confirmation',
                PAYMENT_TIMEOUT: 'timeout',
              },
            },
            threeDS: {
              on: {
                THREE_DS_PASSED: 'processing',
                THREE_DS_FAILED: 'declined',
                THREE_DS_CANCELLED: 'entering',
              },
            },
            declined: {
              // GAP 3: Only retry available. No way back to cart or abandon.
              on: {
                RETRY_PAYMENT: 'entering',
              },
            },
            timeout: {
              // GAP 4: Same trap as declined. Retry only.
              on: {
                RETRY_PAYMENT: 'entering',
              },
            },
          },
        },

        confirmation: {
          // GAP 5: Final state with no RESET transition. Order placed,
          // but if the user wants to immediately buy something else,
          // they have to refresh the whole app.
          type: 'final',
        },
      },
    },
  },
});
