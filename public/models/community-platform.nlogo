;;  ============================================================
;;  COMMUNITY PLATFORM DIAGNOSTICS
;;  When Does a Community Platform Start Feeling Alive?
;;
;;  Agent-Based Simulation of Network Effects, Participation
;;  Density, and Community Ecosystem Dynamics in Event-Driven
;;  Social Platforms.
;;
;;  Inspired by products like Luma, Meetup, Partiful, Geneva.
;;  ============================================================

globals [
  participation-density   ;; proportion of active + host users among non-churned
  community-vitality      ;; composite score 0–100
  total-interactions      ;; cumulative social connections formed
  total-events-created    ;; cumulative events ever created
]

breed [ users user ]
breed [ events event ]

users-own [
  user-state            ;; "new" "passive" "active" "host" "inactive" "churned"
  satisfaction          ;; 0–100  how rewarding the platform feels
  activity-level        ;; 0–1    tendency to attend / engage
  social-connections    ;; count  recurring relationships formed
  host-probability      ;; 0–1    chance of becoming an organizer
  churn-risk            ;; 0–1    probability of leaving
  attendance-history    ;; count  total events attended
  ticks-inactive        ;; count  consecutive ticks spent inactive
  ticks-in-state        ;; count  ticks spent in current state
]

events-own [
  ev-quality       ;; 0–100
  ev-attendance    ;; count of attendees this tick
  ev-visibility    ;; 0–1   how discoverable
  ev-lifespan      ;; ticks remaining
  ev-creator       ;; turtle (user) or nobody
]

;; ============================================================
;; SETUP
;; ============================================================

to setup
  clear-all

  set total-interactions 0
  set total-events-created 0

  ;; Seed initial user population
  create-users initial-users [
    setxy random-xcor random-ycor
    set shape "person"
    set size 1.2
    initialize-new-user
  ]

  ;; Seed initial events so the platform isn't empty on arrival
  repeat initial-events [
    create-events 1 [
      setxy random-xcor random-ycor
      set shape "star"
      set size 1.5
      set color yellow
      set ev-quality      30 + random 50
      set ev-attendance   0
      set ev-visibility   0.4 + random-float 0.4
      set ev-lifespan     8 + random 12
      set ev-creator      nobody
    ]
    set total-events-created total-events-created + 1
  ]

  update-metrics
  color-agents
  reset-ticks
end

to initialize-new-user
  set user-state          "new"
  set satisfaction        35 + random 30
  set activity-level      0.10 + random-float 0.35
  set social-connections  0
  set host-probability    0.02 + random-float 0.05
  set churn-risk          0.25 + random-float 0.20
  set attendance-history  0
  set ticks-inactive      0
  set ticks-in-state      0
end

;; ============================================================
;; MAIN LOOP
;; ============================================================

to go
  ;; --- Acquire new users (organic + referral-driven) ---
  let referral-boost participation-density * referral-strength * acquisition-rate
  let n-new round (acquisition-rate + referral-boost)
  create-users n-new [
    setxy random-xcor random-ycor
    set shape "person"
    set size 1.2
    initialize-new-user
  ]

  ;; --- Users act ---
  ask users with [ user-state != "churned" ] [
    do-tick
  ]

  ;; --- Events decay ---
  ask events [
    set ev-lifespan ev-lifespan - 1
    if ev-lifespan <= 0 [ die ]
  ]

  ;; --- Hosts create new events ---
  ask users with [ user-state = "host" ] [
    if random-float 1 < (event-creation-rate * activity-level) [
      let hx xcor
      let hy ycor
      create-events 1 [
        setxy hx + (random 10 - 5) hy + (random 10 - 5)
        set shape "star"
        set size 1.5
        set color yellow
        set ev-quality      25 + random 65
        set ev-attendance   0
        set ev-visibility   event-visibility + random-float 0.25
        set ev-lifespan     8 + random 15
        set ev-creator      myself
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

  ;; Satisfaction decays slightly each tick (platform must earn retention)
  set satisfaction max list 0 (satisfaction - satisfaction-decay)

  ;; Churn risk is inversely proportional to satisfaction
  set churn-risk (1 - (satisfaction / 100)) * churn-sensitivity

  ;; Dispatch on state
  if user-state = "new"      [ behave-new ]
  if user-state = "passive"  [ behave-passive ]
  if user-state = "active"   [ behave-active ]
  if user-state = "host"     [ behave-host ]
  if user-state = "inactive" [ behave-inactive ]

  ;; Global churn check (all non-churned users)
  if user-state != "churned" [
    if random-float 1 < (churn-risk * 0.04) [
      set user-state "churned"
    ]
  ]
end

;; --- NEW: explore, find first event, or churn quickly ---
to behave-new
  let nearby events in-radius 10
  ifelse any? nearby [
    let target max-one-of nearby [ ev-quality * ev-visibility ]
    attend target
    ;; Successful first experience → activate onboarding
    if random-float 1 < onboarding-quality [
      set user-state "passive"
      set ticks-in-state 0
    ]
  ] [
    ;; No events nearby: patience runs out fast
    if ticks-in-state > 4 [
      ifelse random-float 1 < 0.45
        [ set user-state "passive"  set ticks-in-state 0 ]
        [ set user-state "churned" ]
    ]
  ]
end

;; --- PASSIVE: low engagement, drifts active or churns ---
to behave-passive
  ;; Attend an event if participation density is above floor
  if random-float 1 < (activity-level * (0.3 + participation-density)) [
    let nearby events in-radius 10
    if any? nearby [
      let target max-one-of nearby [ ev-quality * ev-visibility ]
      attend target
    ]
  ]

  ;; Slow social connection formation
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

  ;; Activation threshold
  if attendance-history >= activation-threshold [
    set user-state "active"
    set ticks-in-state 0
    set activity-level min list 1.0 (activity-level + 0.1)
  ]

  ;; Drop to inactive if satisfaction crumbles
  if satisfaction < 20 and ticks-in-state > 6 [
    set user-state "inactive"
    set ticks-inactive 0
    set ticks-in-state 0
  ]
end

;; --- ACTIVE: regular participation, social bonding, host emergence ---
to behave-active
  ;; Attend events regularly
  if random-float 1 < activity-level [
    let nearby events in-radius 14
    if any? nearby [
      let target max-one-of nearby [ ev-quality * ev-visibility ]
      attend target
    ]
  ]

  ;; Form social connections with nearby active users (network effect loop)
  if random-float 1 < (social-reinforcement-strength * 0.25) [
    let peers other users in-radius 6 with [
      user-state = "active" or user-state = "host"
    ]
    if any? peers [
      set social-connections social-connections + 1
      set satisfaction min list 100 (satisfaction + 4)
      set total-interactions total-interactions + 1
      ;; Move slightly toward a peer (spatial clustering)
      face one-of peers
      fd 0.4
    ]
  ]

  ;; Host emergence: highly engaged users begin creating events
  if attendance-history >= host-conversion-threshold [
    if random-float 1 < host-probability [
      set user-state "host"
      set ticks-in-state 0
    ]
  ]

  ;; Inactivation
  if satisfaction < 22 [
    set user-state "inactive"
    set ticks-inactive 0
    set ticks-in-state 0
  ]
end

;; --- HOST: creates events, sensitive to attendance quality ---
to behave-host
  ;; Attend events (hosts stay engaged)
  if random-float 1 < activity-level [
    let nearby events in-radius 14
    if any? nearby [
      let target max-one-of nearby [ ev-quality * ev-visibility ]
      attend target
    ]
  ]

  ;; Satisfaction shaped by how well own events are attended
  let my-evs events with [ ev-creator = myself ]
  if any? my-evs [
    let avg-att mean [ ev-attendance ] of my-evs
    ifelse avg-att > 3
      [ set satisfaction min list 100 (satisfaction + 4) ]  ;; thriving
      [ set satisfaction max list 0  (satisfaction - 2) ]  ;; struggling
  ]

  ;; Strong social bonding
  if random-float 1 < (social-reinforcement-strength * 0.35) [
    let peers other users in-radius 8 with [
      user-state = "active" or user-state = "host"
    ]
    if any? peers [
      set social-connections social-connections + 1
      set total-interactions total-interactions + 1
    ]
  ]

  ;; Host burnout
  if satisfaction < 18 [
    set user-state "inactive"
    set ticks-inactive 0
    set ticks-in-state 0
  ]
end

;; --- INACTIVE: waiting, may reactivate if ecosystem improves ---
to behave-inactive
  set ticks-inactive ticks-inactive + 1

  ;; Reactivation: platform feels alive again
  if participation-density > reactivation-threshold [
    if random-float 1 < 0.12 [
      set satisfaction satisfaction + 15
      set satisfaction min list 100 satisfaction
      set user-state "passive"
      set ticks-inactive 0
      set ticks-in-state 0
    ]
  ]

  ;; Permanent churn if inactive too long
  if ticks-inactive > max-inactive-ticks [
    set user-state "churned"
  ]
end

;; ============================================================
;; EVENT ATTENDANCE
;; ============================================================

to attend [ target ]
  ask target [
    set ev-attendance ev-attendance + 1
  ]

  ;; Quality of experience drives satisfaction gain
  let exp-quality [ ev-quality ] of target
  let gain (exp-quality / 100) * social-reinforcement-strength * 18
  set satisfaction      min list 100 (satisfaction + gain)
  set attendance-history attendance-history + 1
  set activity-level    min list 1.0  (activity-level + 0.015)
  set host-probability  min list 0.5  (host-probability + 0.008)

  ;; Move toward the event (visual clustering)
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
    let n-active count users with [ user-state = "active" or user-state = "host" ]
    set participation-density n-active / n-live

    let event-density-score min list 1 (count events / max 1 (n-live / 8))
    let satisfaction-score   ifelse-value any? live [ mean [ satisfaction ] of live / 100 ] [ 0 ]

    set community-vitality (
      (participation-density  * 40) +
      (event-density-score    * 30) +
      (satisfaction-score     * 30)
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
    if user-state = "new"      [ set color sky      ]  ;; light blue
    if user-state = "passive"  [ set color gray     ]  ;; gray
    if user-state = "active"   [ set color green    ]  ;; green
    if user-state = "host"     [ set color orange   ]  ;; orange
    if user-state = "inactive" [ set color blue     ]  ;; blue
    if user-state = "churned"  [ set color red      ]  ;; red
  ]
end

;; ============================================================
;; REPORTERS (for monitors and plots)
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

to-report host-conversion-rate
  let ever-active count users with [
    user-state = "host" or attendance-history >= host-conversion-threshold
  ]
  ifelse ever-active > 0
    [ report precision (n-host / ever-active * 100) 1 ]
    [ report 0 ]
end

to-report churn-rate
  ifelse n-total > 0
    [ report precision (n-churned / n-total * 100) 1 ]
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
335
275
368
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
375
275
408
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
415
275
448
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
455
275
488
referral-strength
referral-strength
0.0
1.0
0.3
0.05
1
NIL
HORIZONTAL

SLIDER
8
495
275
528
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
535
275
568
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
575
275
608
max-inactive-ticks
max-inactive-ticks
5
50
15.0
1
1
ticks
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
Churned
n-churned
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
950
355
Churn Rate (%)
churn-rate
1
1
11

MONITOR
780
360
950
405
Total Interactions
total-interactions
0
1
11

MONITOR
780
410
950
455
Events Created
total-events-created
0
1
11

PLOT
780
460
1100
640
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
"active" 1.0 0 -10899396 true "" "plot n-active"
"host" 1.0 0 -955883 true "" "plot n-host"
"passive" 1.0 0 -7500403 true "" "plot n-passive"
"inactive" 1.0 0 -13345367 true "" "plot n-inactive"
"churned" 1.0 0 -2674135 true "" "plot n-churned"

PLOT
780
650
1100
820
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
"density ×100" 1.0 0 -13840069 true "" "plot participation-density * 100"
"satisfaction" 1.0 0 -4699768 true "" "plot avg-satisfaction"

@#$#@#$#@
## COMMUNITY PLATFORM DIAGNOSTICS

**When Does a Community Platform Start Feeling Alive?**

An agent-based simulation of network effects, participation density, and community ecosystem dynamics in event-driven social platforms.

---

### HOW TO RUN

1. Adjust sliders to set initial conditions
2. Click **Setup**
3. Click **Go** to run the simulation

---

### AGENT STATES (colours)

- **Sky blue** — New user (just arrived, exploring)
- **Gray** — Passive / lurker (low engagement)
- **Green** — Active participant (regular attendance)
- **Orange** — Host / organiser (creates events)
- **Blue** — Inactive (disengaged, may return)
- **Red** — Churned (permanently left)

---

### KEY PARAMETERS

- **acquisition-rate** — new users arriving per tick
- **onboarding-quality** — probability a new user has a successful first experience
- **churn-sensitivity** — how quickly dissatisfied users leave
- **social-reinforcement-strength** — how much positive interactions boost satisfaction
- **host-conversion-threshold** — events attended before a user may become a host
- **event-creation-rate** — how frequently hosts create new events
- **satisfaction-decay** — how much satisfaction drops each tick without reinforcement

---

### KEY QUESTION

At what participation density does the platform begin feeling socially alive — self-sustaining through recurring interactions rather than dependent on continuous acquisition?

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
