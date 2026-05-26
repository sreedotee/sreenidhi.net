// Checkout state machine — Alloy 6 model
//
// Encodes the same flow region as the XState machine (cart -> review ->
// payment -> confirmation), with the same realistic gaps a first-draft
// designer would leave. Alloy verifies reachability, deadlock-freedom,
// and whether the happy path is preserved from every state.
//
// Run with:
//   java -jar alloy.jar exec 03-checkout.als
//
// Each `check` asks: "is the property always true?"
// Each `run`   asks: "is there an example?"

module checkout

// ----- States -----
abstract sig State {
  next : set State
}

one sig
  CartEmpty,
  CartHasItems,
  CartInventoryWarning,
  Review,
  PaymentMethodSelection,
  PaymentEntering,
  PaymentValidating,
  PaymentProcessing,
  PaymentThreeDS,
  PaymentDeclined,
  PaymentTimeout,
  Confirmation
extends State {}

// ----- Initial state -----
one sig Initial in State {}
fact { Initial = CartEmpty }

// ----- Terminal states -----
one sig Terminal in State {}
fact { Terminal = Confirmation }

// ----- Transition relation (encodes the .machine.js exactly) -----
fact Transitions {
  CartEmpty.next            = CartHasItems
  CartHasItems.next         = CartHasItems + CartEmpty + Review + CartInventoryWarning
  CartInventoryWarning.next = CartHasItems
  Review.next               = CartHasItems + PaymentMethodSelection + CartInventoryWarning
  PaymentMethodSelection.next = PaymentEntering
  PaymentEntering.next      = PaymentValidating
  PaymentValidating.next    = PaymentEntering + PaymentProcessing
  PaymentProcessing.next    = PaymentThreeDS + PaymentDeclined + Confirmation + PaymentTimeout
  PaymentThreeDS.next       = PaymentProcessing + PaymentDeclined + PaymentEntering
  PaymentDeclined.next      = PaymentEntering
  PaymentTimeout.next       = PaymentEntering
  Confirmation.next         = none
}

// ----- Helper predicates -----
pred reachable[s: State] {
  s in Initial.*next
}

pred canReachConfirmation[s: State] {
  Confirmation in s.*next
}

// ===== PROPERTY 1: every state is reachable from Initial =====
assert allStatesReachable {
  all s: State | reachable[s]
}
check allStatesReachable for 12

// ===== PROPERTY 2: no deadlock (non-terminal states have outgoing transitions) =====
assert noDeadlock {
  all s: State | s not in Terminal implies some s.next
}
check noDeadlock for 12

// ===== PROPERTY 3: from every reachable state, the happy path is preserved =====
// (i.e. you can always still get to Confirmation, except from Confirmation itself)
assert happyPathAlwaysReachable {
  all s: State | (reachable[s] and s not in Terminal) implies canReachConfirmation[s]
}
check happyPathAlwaysReachable for 12

// ===== PROPERTY 4: from every state where the user has items, they can abandon -----
// (i.e. there's a path back to CartEmpty or some abandon-equivalent)
// We model "abandon" as: can we get back to CartEmpty?
assert canAlwaysAbandon {
  all s: State | (reachable[s] and s not in Terminal) implies CartEmpty in s.*next
}
check canAlwaysAbandon for 12

// ===== Example finders =====
// Show me an instance where the user is in PaymentDeclined and cannot abandon
pred trappedInDeclined {
  CartEmpty not in PaymentDeclined.*next
}
run trappedInDeclined for 12

// Show me an instance where the user is in PaymentTimeout and cannot reach Confirmation
pred timeoutBlocksHappyPath {
  not canReachConfirmation[PaymentTimeout]
}
run timeoutBlocksHappyPath for 12
