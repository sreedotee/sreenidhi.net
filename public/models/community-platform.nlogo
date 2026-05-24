;;  ============================================================
;;  COMMUNITY PLATFORM DIAGNOSTICS  v2
;;  When Does a Community Platform Start Feeling Alive?
;;
;;  Agent-based simulation of participation density, host
;;  dynamics, and ecosystem health in event-driven communities.
;;
;;  Inspired by Luma, Meetup, Partiful, Geneva.
;;  ============================================================

globals [
  participation-density    ;; proportion of active + host users among non-churned
  community-vitality       ;; composite 0–100 score
  total-interactions       ;; cumulative social connections formed
  total-events-created     ;; cumulative events ever created
  total-churned            ;; cumulative churn count (persists after turtle death)
  total-users-ever-hosted  ;; cumulative host conversions (persists after turtle death)
  total-users-created      ;; all users ever spawned
]

breed [ users user ]
breed [ events event ]

users-own [
  user-state            ;; "new" "passive" "active" "host" "inactive" "churned"
  satisfaction          ;; 0–100
  activity-level        ;; 0–1
  social-connections    ;; count of recurring relationships formed
  host-probability      ;; 0–1 chance of converting when host-eligible
  churn-risk            ;; 0–1 derived each tick from satisfaction
  attendance-history    ;; total events attended
  ticks-inactive        ;; consecutive ticks spent inactive
  ticks-in-state        ;; ticks since last state change
  ever-hosted?          ;; true once the user has become a host (survives state changes)
  ticks-churned         ;; countdown before churned turtle is removed
]

events-own [
  ev-quality             ;; 0–100 intrinsic quality
  ev-attendance-tick     ;; attendees THIS tick only — resets every go cycle
  ev-total-attendance    ;; cumulative attendees over event lifetime
  ev-visibility          ;; 0–1 discoverability
  ev-lifespan            ;; ticks remaining before expiry
  ev-creator             ;; turtle (user) or nobody
]

;; ============================================================
;; SETUP
;; ============================================================

to setup
  clear-all

  set total-interactions      0
  set total-events-created    0
  set total-churned           0
  set total-users-ever-hosted 0
  set total-users-created     0

  create-users initial-users [
    setxy random-xcor random-ycor
    set shape "person"
    set size 1.2
    initialize-new-user
  ]
  set total-users-created initial-users

  repeat initial-events [
    create-events 1 [
      setxy random-xcor random-ycor
      set shape "star"
      set size 1.5
      set color yellow
      set ev-quality          30 + random 50
      set ev-attendance-tick  0
      set ev-total-attendance 0
      set ev-visibility       0.4 + random-float 0.4
      set ev-lifespan         8 + random 12
      set ev-creator          nobody
    ]
    set total-events-created total-events-created + 1
  ]

  update-metrics
  color-agents
  reset-ticks
end

to initialize-new-user
  set user-state         "new"
  set satisfaction       35 + random 30
  set activity-level     0.10 + random-float 0.35
  set social-connections 0
  set host-probability   0.02 + random-float 0.05
  set churn-risk         0.25 + random-float 0.20
  set attendance-history 0
  set ticks-inactive     0
  set ticks-in-state     0
  set ever-hosted?       false
  set ticks-churned      0
end

;; ============================================================
;; MAIN LOOP
;; ============================================================

to go
  ;; 1. Reset per-tick attendance so host satisfaction reflects only this tick
  ask events [ set ev-attendance-tick 0 ]

  ;; 2. Platform curation: incrementally boost visibility of high-quality events
  ;;    Simulates algorithmic surfacing — only high-quality content benefits
  if curation-strength > 0 [
    ask events with [ ev-quality > 70 ] [
      set ev-visibility min list 1.0 (ev-visibility + curation-strength * 0.02)
    ]
  ]

  ;; 3. Acquire new users: referral multiplies the organic rate when community is dense
  let n-new round (acquisition-rate * (1 + referral-strength * participation-density))
  create-users n-new [
    setxy random-xcor random-ycor
    set shape "person"
    set size 1.2
    initialize-new-user
  ]
  set total-users-created total-users-created + n-new

  ;; 4. All non-churned users act
  ask users with [ user-state != "churned" ] [
    do-tick
  ]

  ;; 5. Host satisfaction updated AFTER all users have attended events this tick
  ;;    This ensures ev-attendance-tick is fully populated before hosts evaluate it
  update-host-satisfaction

  ;; 6. Churned turtles are displayed briefly then removed
  ;;    Prevents turtle accumulation that would slow the simulation
  ask users with [ user-state = "churned" ] [
    set ticks-churned ticks-churned + 1
    if ticks-churned > 8 [ die ]
  ]

  ;; 7. Events decay
  ask events [
    set ev-lifespan ev-lifespan - 1
    if ev-lifespan <= 0 [ die ]
  ]

  ;; 8. Hosts create new events
  ask users with [ user-state = "host" ] [
    if random-float 1 < (event-creation-rate * activity-level) [
      let hx xcor
      let hy ycor
      create-events 1 [
        setxy hx + (random 10 - 5) hy + (random 10 - 5)
        set shape "star"
        set size 1.5
        set color yellow
        set ev-quality          25 + random 65
        set ev-attendance-tick  0
        set ev-total-attendance 0
        set ev-visibility       event-visibility + random-float 0.25
        set ev-lifespan         8 + random 15
        set ev-creator          myself
      ]
      set total-events-created total-events-created + 1
    ]
  ]

  update-metrics
  color-agents
  tick
end

;; ============================================================
;; PER-USER TICK LOGIC
;; ============================================================

to do-tick
  set ticks-in-state ticks-in-state + 1

  ;; Satisfaction decays each tick — platform must earn retention
  set satisfaction max list 0 (satisfaction - satisfaction-decay)

  ;; Churn risk is a function of dissatisfaction scaled by sensitivity
  set churn-risk (1 - (satisfaction / 100)) * churn-sensitivity

  if user-state = "new"      [ behave-new      ]
  if user-state = "passive"  [ behave-passive  ]
  if user-state = "active"   [ behave-active   ]
  if user-state = "host"     [ behave-host     ]
  if user-state = "inactive" [ behave-inactive ]

  ;; Global churn check — base-churn-rate is now a slider, not a magic constant
  if user-state != "churned" [
    if random-float 1 < (churn-risk * base-churn-rate) [
      go-churned
    ]
  ]
end

;; Shared churn transition — keeps global counter and visual timer in sync
to go-churned
  set user-state    "churned"
  set ticks-churned 0
  set total-churned total-churned + 1
end

;; --- NEW: explore, find first event, or leave quickly ---
to behave-new
  let nearby events in-radius 10
  ifelse any? nearby [
    let target max-one-of nearby [ ev-quality * ev-visibility ]
    attend target
    if random-float 1 < onboarding-quality [
      set user-state "passive"
      set ticks-in-state 0
    ]
  ] [
    ;; No relevant events in range — patience runs out after ~4 ticks
    if ticks-in-state > 4 [
      ifelse random-float 1 < 0.45
        [ set user-state "passive"  set ticks-in-state 0 ]
        [ go-churned ]
    ]
  ]
end

;; --- PASSIVE: low engagement, drifts toward activation or churn ---
to behave-passive
  ;; Probability capped at 1.0 to avoid effectively guaranteed attendance
  if random-float 1 < min list 1.0 (activity-level * (0.3 + participation-density)) [
    let nearby events in-radius 10
    if any? nearby [
      let target max-one-of nearby [ ev-quality * ev-visibility ]
      attend target
    ]
  ]

  if random-float 1 < (social-reinforcement-strength * 0.1) [
    let peers other users in-radius 5 with [
      user-state = "active" or user-state = "host"
    ]
    if any? peers [
      set social-connections social-connections + 1
      set satisfaction min list 100 (satisfaction + 2)
      set total-interactions total-interactions + 1
    ]
  ]

  if attendance-history >= activation-threshold [
    set user-state "active"
    set ticks-in-state 0
    set activity-level min list 1.0 (activity-level + 0.1)
  ]

  if satisfaction < 20 and ticks-in-state > 6 [
    set user-state "inactive"
    set ticks-inactive 0
    set ticks-in-state 0
  ]
end

;; --- ACTIVE: regular participation, social bonding, host emergence ---
to behave-active
  if random-float 1 < activity-level [
    let nearby events in-radius 14
    if any? nearby [
      let target max-one-of nearby [ ev-quality * ev-visibility ]
      attend target
    ]
  ]

  if random-float 1 < (social-reinforcement-strength * 0.25) [
    let peers other users in-radius 6 with [
      user-state = "active" or user-state = "host"
    ]
    if any? peers [
      set social-connections social-connections + 1
      set satisfaction min list 100 (satisfaction + 4)
      set total-interactions total-interactions + 1
      face one-of peers
      fd 0.4
    ]
  ]

  if attendance-history >= host-conversion-threshold [
    if random-float 1 < host-probability [
      set user-state "host"
      set ticks-in-state 0
      ;; Track globally so the rate survives if this user later churns
      if not ever-hosted? [
        set ever-hosted? true
        set total-users-ever-hosted total-users-ever-hosted + 1
      ]
    ]
  ]

  if satisfaction < 22 [
    set user-state "inactive"
    set ticks-inactive 0
    set ticks-in-state 0
  ]
end

;; --- HOST: sensitive to own event attendance; burnout drives inactivity ---
to behave-host
  if random-float 1 < activity-level [
    let nearby events in-radius 14
    if any? nearby [
      let target max-one-of nearby [ ev-quality * ev-visibility ]
      attend target
    ]
  ]

  if random-float 1 < (social-reinforcement-strength * 0.35) [
    let peers other users in-radius 8 with [
      user-state = "active" or user-state = "host"
    ]
    if any? peers [
      set social-connections social-connections + 1
      set total-interactions total-interactions + 1
    ]
  ]

  ;; Burnout check uses satisfaction updated by update-host-satisfaction (last tick's data)
  if satisfaction < 18 [
    set user-state "inactive"
    set ticks-inactive 0
    set ticks-in-state 0
  ]
end

;; Called in go AFTER all attendance is recorded — host satisfaction is based on
;; ev-attendance-tick (this tick only), not cumulative attendance
to update-host-satisfaction
  ask users with [ user-state = "host" ] [
    let my-evs events with [ ev-creator = myself ]
    if any? my-evs [
      let avg-att mean [ ev-attendance-tick ] of my-evs
      ;; Hosts are sustained when their events draw at least 1 attendee/tick on average
      ifelse avg-att >= 1
        [ set satisfaction min list 100 (satisfaction + 4) ]
        [ set satisfaction max list 0  (satisfaction - 2) ]
    ]
  ]
end

;; --- INACTIVE: waiting; reactivated by community density or platform outreach ---
to behave-inactive
  set ticks-inactive ticks-inactive + 1

  ;; Natural reactivation when the community feels active enough
  if participation-density > reactivation-threshold [
    if random-float 1 < 0.12 [
      set satisfaction min list 100 (satisfaction + 15)
      set user-state  "passive"
      set ticks-inactive 0
      set ticks-in-state 0
    ]
  ]

  ;; Platform re-engagement: reaches inactive users regardless of community state
  ;; Simulates push notifications, email digests, re-engagement campaigns
  if notification-rate > 0 [
    if random-float 1 < notification-rate [
      set satisfaction min list 100 (satisfaction + 20)
      if satisfaction > 25 [
        set user-state  "passive"
        set ticks-inactive 0
        set ticks-in-state 0
      ]
    ]
  ]

  if ticks-inactive > max-inactive-ticks [
    go-churned
  ]
end

;; ============================================================
;; EVENT ATTENDANCE
;; ============================================================

to attend [ target ]
  ask target [
    set ev-attendance-tick  ev-attendance-tick + 1
    set ev-total-attendance ev-total-attendance + 1
  ]

  let exp-quality [ ev-quality ] of target
  let gain (exp-quality / 100) * social-reinforcement-strength * 18
  set satisfaction      min list 100 (satisfaction + gain)
  set attendance-history attendance-history + 1
  set activity-level    min list 1.0  (activity-level + 0.015)
  set host-probability  min list 0.5  (host-probability + 0.008)

  face target
  fd min list 1.0 (distance target * 0.3)
end

;; ============================================================
;; METRICS
;; ============================================================

to update-metrics
  let live users with [ user-state != "churned" ]
  let n-live count live

  ifelse n-live > 0 [
    let n-active-and-host count users with [
      user-state = "active" or user-state = "host"
    ]
    set participation-density n-active-and-host / n-live

    ;; 1 event per 10 live users is the "healthy density" benchmark
    let event-density-score min list 1 (count events * 10 / max 1 n-live)
    let satisfaction-score  ifelse-value any? live
      [ mean [ satisfaction ] of live / 100 ]
      [ 0 ]

    set community-vitality (
      (participation-density * 40) +
      (event-density-score   * 30) +
      (satisfaction-score    * 30)
    )
  ] [
    set participation-density 0
    set community-vitality    0
  ]
end

;; ============================================================
;; VISUALISATION
;; ============================================================

to color-agents
  ask users [
    if user-state = "new"      [ set color sky    ]
    if user-state = "passive"  [ set color gray   ]
    if user-state = "active"   [ set color green  ]
    if user-state = "host"     [ set color orange ]
    if user-state = "inactive" [ set color blue   ]
    if user-state = "churned"  [ set color red    ]
  ]
end

;; ============================================================
;; REPORTERS
;; ============================================================

to-report n-new      report count users with [ user-state = "new"      ] end
to-report n-passive  report count users with [ user-state = "passive"  ] end
to-report n-active   report count users with [ user-state = "active"   ] end
to-report n-host     report count users with [ user-state = "host"     ] end
to-report n-inactive report count users with [ user-state = "inactive" ] end
to-report n-churned  report count users with [ user-state = "churned"  ] end
to-report n-total    report count users                                   end
to-report n-events   report count events                                  end

to-report avg-satisfaction
  let live users with [ user-state != "churned" ]
  ifelse any? live
    [ report precision (mean [ satisfaction ] of live) 1 ]
    [ report 0 ]
end

;; Fraction of all ever-spawned users who became hosts at any point
;; Uses persistent globals so ex-hosts who later churned are still counted
to-report host-conversion-rate
  ifelse total-users-created > 0
    [ report precision (total-users-ever-hosted / total-users-created * 100) 1 ]
    [ report 0 ]
end

;; Lifetime churn rate: total churned / total ever created
;; Not a snapshot — meaningful even after churned turtles are removed
to-report churn-rate
  ifelse total-users-created > 0
    [ report precision (total-churned / total-users-created * 100) 1 ]
    [ report 0 ]
end
@#$#@#$#@
GRAPHICS-WINDOW
285
10
773
499
-1
-1
7.3
1
10
1
1
1
0
1
1
1
-32
32
-32
32
1
1
1
ticks
30.0

BUTTON
8
10
138
43
Setup
setup
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL
1

BUTTON
145
10
275
43
Go
go
T
1
T
OBSERVER
NIL
NIL
NIL
NIL
0

SLIDER
8
55
275
88
initial-users
initial-users
10
200
50.0
5
1
NIL
HORIZONTAL

SLIDER
8
95
275
128
initial-events
initial-events
0
20
5.0
1
1
NIL
HORIZONTAL

SLIDER
8
135
275
168
acquisition-rate
acquisition-rate
0
10
2.0
0.5
1
users/tick
HORIZONTAL

SLIDER
8
175
275
208
onboarding-quality
onboarding-quality
0.0
1.0
0.4
0.05
1
NIL
HORIZONTAL

SLIDER
8
215
275
248
satisfaction-decay
satisfaction-decay
0.0
5.0
1.0
0.1
1
pts/tick
HORIZONTAL

SLIDER
8
255
275
288
churn-sensitivity
churn-sensitivity
0.0
1.0
0.5
0.05
1
NIL
HORIZONTAL

SLIDER
8
295
275
328
base-churn-rate
base-churn-rate
0.01
0.15
0.04
0.005
1
NIL
HORIZONTAL

SLIDER
8
335
275
368
social-reinforcement-strength
social-reinforcement-strength
0.0
1.0
0.6
0.05
1
NIL
HORIZONTAL

SLIDER
8
375
275
408
activation-threshold
activation-threshold
1
10
3.0
1
1
events
HORIZONTAL

SLIDER
8
415
275
448
host-conversion-threshold
host-conversion-threshold
3
25
10.0
1
1
events
HORIZONTAL

SLIDER
8
455
275
488
event-creation-rate
event-creation-rate
0.0
0.5
0.15
0.01
1
NIL
HORIZONTAL

SLIDER
8
495
275
528
event-visibility
event-visibility
0.1
1.0
0.5
0.05
1
NIL
HORIZONTAL

SLIDER
8
535
275
568
referral-strength
referral-strength
0.0
2.0
0.3
0.05
1
NIL
HORIZONTAL

SLIDER
8
575
275
608
reactivation-threshold
reactivation-threshold
0.0
1.0
0.3
0.05
1
NIL
HORIZONTAL

SLIDER
8
615
275
648
max-inactive-ticks
max-inactive-ticks
5
50
15.0
1
1
ticks
HORIZONTAL

SLIDER
8
655
275
688
notification-rate
notification-rate
0.0
0.3
0.0
0.01
1
NIL
HORIZONTAL

SLIDER
8
695
275
728
curation-strength
curation-strength
0.0
1.0
0.0
0.05
1
NIL
HORIZONTAL

MONITOR
780
10
950
55
Participation Density
precision participation-density 3
3
1
11

MONITOR
780
60
950
105
Community Vitality
precision community-vitality 1
1
1
11

MONITOR
780
110
870
155
Active
n-active
0
1
11

MONITOR
875
110
950
155
Hosts
n-host
0
1
11

MONITOR
780
160
870
205
Passive
n-passive
0
1
11

MONITOR
875
160
950
205
Inactive
n-inactive
0
1
11

MONITOR
780
210
870
255
Churned (life)
total-churned
0
1
11

MONITOR
875
210
950
255
Events
n-events
0
1
11

MONITOR
780
260
950
305
Avg Satisfaction
avg-satisfaction
1
1
11

MONITOR
780
310
870
355
Churn Rate (%)
churn-rate
1
1
11

MONITOR
875
310
950
355
Host Conv (%)
host-conversion-rate
1
1
11

MONITOR
780
360
870
405
Total Interactions
total-interactions
0
1
11

MONITOR
875
360
950
405
Events Created
total-events-created
0
1
11

PLOT
780
415
1100
595
User States Over Time
ticks
users
0.0
10.0
0.0
10.0
true
true
"" ""
PENS
"new" 1.0 0 -6995700 true "" "plot n-new"
"active" 1.0 0 -10899396 true "" "plot n-active"
"host" 1.0 0 -955883 true "" "plot n-host"
"passive" 1.0 0 -7500403 true "" "plot n-passive"
"inactive" 1.0 0 -13345367 true "" "plot n-inactive"

PLOT
780
605
1100
775
Ecosystem Health
ticks
0-100
0.0
10.0
0.0
100.0
true
true
"" ""
PENS
"vitality" 1.0 0 -11221820 true "" "plot community-vitality"
"density x100" 1.0 0 -13840069 true "" "plot participation-density * 100"
"satisfaction" 1.0 0 -4699768 true "" "plot avg-satisfaction"

@#$#@#$#@
## COMMUNITY PLATFORM DIAGNOSTICS v2

**When Does a Community Platform Start Feeling Alive?**

An agent-based simulation of participation density, host dynamics, and ecosystem health in event-driven social platforms. Inspired by Luma, Meetup, Partiful, Geneva.

---

### HOW TO RUN

1. Adjust sliders to set your scenario
2. Click **Setup** to initialise
3. Click **Go** to run — click again to pause

---

### WHAT SPACE REPRESENTS

Proximity represents **interest affinity**, not geography. Users near each other share interests; events near a user are relevant to them. Real platform discovery is algorithmic — but interest-based clustering produces similar neighbourhood dynamics.

---

### AGENT STATES

- **Sky blue** — New: just arrived, exploring
- **Gray** — Passive: low engagement, lurking
- **Green** — Active: regular attendance
- **Orange** — Host: creates events, central to the ecosystem
- **Blue** — Inactive: disengaged, may return
- **Red** — Churned: briefly visible (8 ticks), then removed

---

### PARAMETERS

**Acquisition & Onboarding**
- `acquisition-rate` — organic new users per tick
- `referral-strength` — how much participation density multiplies acquisition
- `onboarding-quality` — probability of a successful first event experience

**Retention & Churn**
- `satisfaction-decay` — satisfaction lost per tick without reinforcement
- `churn-sensitivity` — how strongly dissatisfaction drives churn risk
- `base-churn-rate` — probability scaling on churn risk each tick (was a hardcoded constant in v1)
- `max-inactive-ticks` — ticks before an inactive user permanently churns

**Engagement & Social**
- `social-reinforcement-strength` — satisfaction boost from peer interactions
- `activation-threshold` — events attended before passive → active transition
- `reactivation-threshold` — minimum participation density before inactive users consider returning

**Host Dynamics**
- `host-conversion-threshold` — events attended before host eligibility
- `event-creation-rate` — probability a host creates an event each tick
- `event-visibility` — baseline discoverability of newly created events

**Platform Interventions**
- `notification-rate` — per-tick probability inactive users receive a re-engagement nudge (push notifications, email digests)
- `curation-strength` — per-tick visibility boost to events with quality > 70 (algorithmic surfacing)

---

### TESTABLE HYPOTHESES

**H1 — Participation density threshold**
Community vitality self-sustains above 60 only when participation density exceeds ~0.30. Below this, the platform depends on continuous acquisition to feel alive.

*Test: Run with acquisition-rate = 0 after tick 50. Does vitality hold if density > 0.30?*

**H2 — Host burnout cascade**
If host burnout outpaces conversion, vitality collapses within ~40 ticks regardless of acquisition rate. The active count may stay stable while hosts drain — vitality falls before active count does.

*Test: Set host-conversion-threshold = 20, event-creation-rate = 0.4. Watch hosts burn out faster than they're replaced.*

**H3 — Notifications outperform acquisition at high churn**
When churn-sensitivity > 0.7, raising notification-rate extends community lifespan more effectively than raising acquisition-rate. Reactivating an existing user costs less than replacing them.

*Test: High churn scenario. Compare notification-rate = 0.1 vs acquisition-rate +2 on community-vitality over 100 ticks.*

---

### WHAT CHANGED IN V2

- **Churned turtles die after 8 ticks** — prevents accumulation and performance degradation over long runs
- **Host satisfaction uses this-tick attendance only** — `ev-attendance-tick` resets every cycle; cumulative attendance no longer inflates the signal
- **`host-conversion-rate` is accurate** — uses persistent globals, so ex-hosts who later churned are still counted; denominator is all users ever spawned
- **`churn-rate` is a lifetime rate** — total churned / total ever spawned; not a live snapshot that drops as turtles die
- **`base-churn-rate` is now a slider** — the internal magic constant 0.04 is exposed and adjustable
- **Passive attendance probability capped at 1.0** — was uncapped and could exceed 1.3
- **Two platform levers added** — `notification-rate` and `curation-strength`
- **Referral formula simplified** — `acquisition-rate × (1 + referral-strength × density)`

---

### KNOWN LIMITATIONS

- Transition probabilities are calibrated for plausible dynamics, not empirical data
- No content quality degradation — events keep their initial quality score throughout their lifespan
- Space represents interest proximity, not real geography or network topology
- A "tick" is a loose proxy for a day or week depending on acquisition-rate calibration
- The host satisfaction floor (1 attendee/tick) is a design choice; real platform thresholds vary

@#$#@#$#@
default
true
0
Polygon -7500403 true true 150 5 40 250 150 205 260 250

star
false
0
Polygon -7500403 true true 151 1 185 108 298 108 207 175 242 282 151 216 59 282 94 175 3 108 116 108

person
false
0
Circle -7500403 true true 110 5 80
Polygon -7500403 true true 105 90 120 195 90 285 105 300 135 300 150 225 165 300 195 300 210 285 180 195 195 90
Rectangle -7500403 true true 127 79 172 94
Polygon -7500403 true true 195 90 240 150 225 180 165 105
Polygon -7500403 true true 105 90 60 150 75 180 135 105

@#$#@#$#@
NetLogo 6.4.0
@#$#@#$#@
@#$#@#$#@
@#$#@#$#@
1
