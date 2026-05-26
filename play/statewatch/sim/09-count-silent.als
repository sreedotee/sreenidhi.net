// Count unhandled (state, event) pairs
open 08-experiment-b

pred countAllSilent {
  some s: State, e: Event | no s.next[e]
}
run countAllSilent for 13 State, 21 Event
