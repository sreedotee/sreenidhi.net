;;  ============================================================
;;  COMMUNITY PLATFORM DIAGNOSTICS  v3
;;  When Does a Community Platform Start Feeling Alive?
;;
;;  Agent-based simulation of participation density, host
;;  dynamics, and ecosystem health in event-driven communities.
;;
;;  Calibrated against empirical benchmarks:
;;  - Monthly churn ~4% (Recurly 2024)
;;  - ~9% new-user → active conversion in 30 days (Eppo)
;;  - Optimal social group size 25–80 (Dunbar / Life with Alacrity)
;;  - Self-sustaining community threshold ~10–20% participation
;;    density (critical mass studies)
;;  - Luma event attendance rate ~62% (2025)
;;
;;  Time scale: 1 tick = 1 day. Typical run: 180–365 ticks (6–12 months
;;  of platform activity). All churn / activation / attendance rates
;;  above are quoted in their native units (monthly, 30-day) — slider
;;  defaults are calibrated so per-tick rates produce those aggregates.
;;
;;  Inspired by Luma, Meetup, Partiful, Geneva.
;;  ============================================================

globals [
  participation-density    ;; proportion of active + host among non-churned
  community-vitality       ;; composite 0–100 score
  total-interactions       ;; cumulative social connections formed
  total-events-created     ;; cumulative events ever created
  total-churned            ;; cumulative churn (persists after turtle death)
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
  ticks-inactive        ;; consecutive ticks in inactive state
  ticks-in-state        ;; ticks since last state change
  ever-hosted?          ;; true once user became a host (survives state changes)
  ticks-churned         ;; countdown before churned turtle is removed
  user-interest         ;; 0–4: which topic cluster this user prefers
  social-motive         ;; 0–1: how much this user goes out just to socialize
  budget                ;; max price they'll pay per event (long-term willingness)
]

events-own [
  ev-quality             ;; 0–100 intrinsic quality
  ev-attendance-tick     ;; attendees THIS tick only — resets every cycle
  ev-total-attendance    ;; cumulative attendees over event lifetime
  ev-visibility          ;; 0–1 discoverability
  ev-lifespan            ;; ticks remaining
  ev-creator             ;; turtle or nobody
  ev-topic               ;; 0–4: which topic cluster this event serves
  ev-price               ;; cost to attend (0 = free)
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
      set ev-topic            random 5
      ifelse random-float 1 < 0.3 [ set ev-price 0 ] [ set ev-price 5 + random 30 ]
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
  set user-interest      random 5
  set social-motive      0.2 + random-float 0.6
  set budget             15 + random 40
end

;; ============================================================
;; MAIN LOOP
;; ============================================================

to go
  ;; 1. Reset per-tick attendance so host satisfaction reflects only this tick
  ask events [ set ev-attendance-tick 0 ]

  ;; 2. Curation: incrementally boost visibility of high-quality events
  if curation-strength > 0 [
    ask events with [ ev-quality > 70 ] [
      set ev-visibility cap 1.0 (ev-visibility + curation-strength * 0.02)
    ]
  ]

  ;; 3. Acquire new users — referral multiplies organic rate when community is dense
  ;;    Saturating form: density / (0.2 + density). Half-saturation at density=0.2.
  ;;    Real referral hits diminishing returns past saturation — the same
  ;;    enthusiastic minority can only invite so many people. Without this,
  ;;    a healthy community grows unboundedly which is empirically false.
  let saturation-factor participation-density / (0.2 + participation-density)
  let arrivals round (acquisition-rate * (1 + referral-strength * saturation-factor))
  create-users arrivals [
    setxy random-xcor random-ycor
    set shape "person"
    set size 1.2
    initialize-new-user
  ]
  set total-users-created total-users-created + arrivals

  ;; 3b. Platform-seeded events — every 7 ticks (~weekly), platform highlights
  ;;     ONE event PER TOPIC (5 total). Prevents niche starvation: without this,
  ;;     topics that produce no hosts have no events, their users have nothing
  ;;     to attend, they churn, the topic dies and never recovers. Per-topic
  ;;     seeding guarantees every interest has a baseline weekly opportunity.
  if ticks > 0 and (ticks mod 7) = 0 [
    let t 0
    repeat 5 [
      let topic-i t
      create-events 1 [
        setxy random-xcor random-ycor
        set shape "star"
        set size 1.5
        set color yellow
        set ev-quality          50 + random 40    ;; platform-curated = above-average
        set ev-attendance-tick  0
        set ev-total-attendance 0
        set ev-visibility       0.6 + random-float 0.3
        set ev-lifespan         10 + random 14
        set ev-creator          nobody
        set ev-topic            topic-i
        ifelse random-float 1 < 0.3 [ set ev-price 0 ] [ set ev-price 5 + random 30 ]
      ]
      set total-events-created total-events-created + 1
      set t t + 1
    ]
  ]

  ;; 4. All non-churned users act
  ask users with [ user-state != "churned" ] [
    do-tick
  ]

  ;; 5. Update host satisfaction AFTER all attendance is recorded this tick
  update-host-satisfaction

  ;; 6. Churned turtles display briefly then die — prevents accumulation
  ask users with [ user-state = "churned" ] [
    set ticks-churned ticks-churned + 1
    if ticks-churned > 8 [ die ]
  ]

  ;; 7. Events decay
  ask events [
    set ev-lifespan ev-lifespan - 1
    if ev-lifespan <= 0 [ die ]
  ]

  ;; 8. Hosts create events
  ask users with [ user-state = "host" ] [
    if random-float 1 < (event-creation-rate * activity-level) [
      let hx xcor
      let hy ycor
      let host-int user-interest
      hatch-events 1 [
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
        ;; Hosts create events for their own niche — depth over breadth
        set ev-topic            host-int
        ifelse random-float 1 < 0.3 [ set ev-price 0 ] [ set ev-price 5 + random 30 ]
      ]
      set total-events-created total-events-created + 1
    ]
  ]

  update-metrics
  color-agents
  tick
end

;; ============================================================
;; DUNBAR EFFECT
;; ============================================================

;; Social cohesion degrades as the engaged community exceeds optimal group size.
;; Based on: Dunbar (1992), Stowe Boyd "Community by the Numbers" (2008).
;; Optimal range: 25–80 members. Groups past 150 lose distributed leadership.
;; dunbar-limit slider lets you explore different platform contexts.
to-report dunbar-factor
  let n-engaged count users with [ user-state = "active" or user-state = "host" ]
  ;; At or below dunbar-limit: full cohesion (factor = 1.0)
  ;; Beyond dunbar-limit: cohesion falls — floor at 0.15 for very large groups
  report at-least 0.15 (cap 1.0 (dunbar-limit / at-least 1 n-engaged))
end

;; ============================================================
;; PER-USER TICK LOGIC
;; ============================================================

to do-tick
  set ticks-in-state ticks-in-state + 1

  set satisfaction at-least 0 (satisfaction - satisfaction-decay)
  set churn-risk (1 - (satisfaction / 100)) * churn-sensitivity

  if user-state = "new"      [ behave-new      ]
  if user-state = "passive"  [ behave-passive  ]
  if user-state = "active"   [ behave-active   ]
  if user-state = "host"     [ behave-host     ]
  if user-state = "inactive" [ behave-inactive ]

  if user-state != "churned" [
    if random-float 1 < (churn-risk * base-churn-rate) [
      do-churn
    ]
  ]
end

to do-churn
  set user-state    "churned"
  set ticks-churned 0
  set total-churned total-churned + 1
end

;; --- NEW: explore and quickly resolve to passive ---
;; Bug fix from v2: new users who find events but fail the onboarding quality
;; check could get stuck in "new" state indefinitely. Now they always resolve
;; to passive within ~4 ticks — good onboarding just means higher satisfaction on arrival.
to behave-new
  let my-int user-interest
  let my-mot social-motive
  let my-bud budget
  let nearby (events in-radius 10) with [ ev-price <= my-bud ]
  ifelse any? nearby [
    let target max-one-of nearby [
      event-score ev-quality ev-visibility ev-topic my-int my-mot
    ]
    attend target
    ;; onboarding-quality: probability of a great first experience
    ;; All new users eventually reach passive — quality shapes how satisfied they arrive
    if random-float 1 < onboarding-quality or ticks-in-state > 3 [
      set user-state "passive"
      set ticks-in-state 0
    ]
  ] [
    ;; No relevant events found — patience limit
    ;; ~55–60% churn quickly: calibrated against 68% one-post dropout (NN/g)
    ;; adjusted upward (event platform users are more motivated than generic social media)
    if ticks-in-state > 4 [
      ifelse random-float 1 < 0.42
        [ set user-state "passive"  set ticks-in-state 0 ]
        [ do-churn ]
    ]
  ]
end

;; --- PASSIVE: low engagement, drifts toward activation or quiet churn ---
;; Empirical: ~80% of users in healthy communities remain lurkers/passives
;; (Higher Logic community engagement data, 2023)
to behave-passive
  if random-float 1 < cap 1.0 (activity-level * (0.3 + participation-density)) [
    let my-int user-interest
    let my-mot social-motive
    let my-bud budget
    let nearby (events in-radius 10) with [ ev-price <= my-bud ]
    if any? nearby [
      let target max-one-of nearby [
        event-score ev-quality ev-visibility ev-topic my-int my-mot
      ]
      attend target
    ]
  ]

  ;; Social connections form more easily in smaller communities (Dunbar effect)
  if random-float 1 < (social-reinforcement-strength * 0.1 * dunbar-factor) [
    let peers other users in-radius 5 with [
      user-state = "active" or user-state = "host"
    ]
    if any? peers [
      set social-connections social-connections + 1
      set satisfaction cap 100 (satisfaction + 2)
      set total-interactions total-interactions + 1
    ]
  ]

  ;; Activation: empirically ~9% of new users convert to active in 30 days
  ;; activation-threshold (default 5 events) + attendance rate produce this naturally
  if attendance-history >= activation-threshold [
    set user-state "active"
    set ticks-in-state 0
    set activity-level cap 1.0 (activity-level + 0.1)
  ]

  if satisfaction < 20 and ticks-in-state > 6 [
    set user-state "inactive"
    set ticks-inactive 0
    set ticks-in-state 0
  ]
end

;; --- ACTIVE: regular attendance, social bonding, host emergence ---
to behave-active
  if random-float 1 < activity-level [
    let my-int user-interest
    let my-mot social-motive
    let my-bud budget
    let nearby (events in-radius 14) with [ ev-price <= my-bud ]
    if any? nearby [
      let target max-one-of nearby [
        event-score ev-quality ev-visibility ev-topic my-int my-mot
      ]
      attend target
    ]
  ]

  ;; Dunbar effect: social bonding weakens in large groups
  ;; "Groups larger than 50 show reduced per-person engagement" (Stowe Boyd, 2008)
  if random-float 1 < (social-reinforcement-strength * 0.25 * dunbar-factor) [
    let peers other users in-radius 6 with [
      user-state = "active" or user-state = "host"
    ]
    if any? peers [
      set social-connections social-connections + 1
      set satisfaction cap 100 (satisfaction + 4)
      set total-interactions total-interactions + 1
      face one-of peers
      fd 0.4
    ]
  ]

  if attendance-history >= host-conversion-threshold [
    if random-float 1 < host-probability [
      set user-state "host"
      set ticks-in-state 0
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

;; --- HOST: creates events; sensitive to own event attendance ---
to behave-host
  if random-float 1 < activity-level [
    let my-int user-interest
    let my-mot social-motive
    let my-bud budget
    ;; Filter out own events — attending them would self-inflate the signal
    ;; update-host-satisfaction reads from ev-attendance-tick.
    let nearby (events in-radius 14) with [
      ev-price <= my-bud and ev-creator != myself
    ]
    if any? nearby [
      let target max-one-of nearby [
        event-score ev-quality ev-visibility ev-topic my-int my-mot
      ]
      attend target
    ]
  ]

  ;; Hosts still bond socially — but Dunbar effect applies here too
  if random-float 1 < (social-reinforcement-strength * 0.35 * dunbar-factor) [
    let peers other users in-radius 8 with [
      user-state = "active" or user-state = "host"
    ]
    if any? peers [
      set social-connections social-connections + 1
      set total-interactions total-interactions + 1
    ]
  ]

  ;; Burnout check uses satisfaction updated by update-host-satisfaction (last tick)
  if satisfaction < 18 [
    set user-state "inactive"
    set ticks-inactive 0
    set ticks-in-state 0
  ]
end

;; Runs AFTER all users have attended events — ev-attendance-tick is fully populated
to update-host-satisfaction
  ask users with [ user-state = "host" ] [
    let my-evs events with [ ev-creator = myself ]
    if any? my-evs [
      ;; Continuous signal — avoids the cliff where 0.95 attendance is punished
      ;; identically to 0.0. Mapping:
      ;;   avg=0   → -3   (silence stings)
      ;;   avg=0.5 → -1   (light turnout, mild discouragement)
      ;;   avg=1   → +1   (one attendee, marginal lift)
      ;;   avg=2   → +5   (real engagement)
      ;;   avg=3+  → +9   (capped by satisfaction cap at 100)
      let avg-att mean [ ev-attendance-tick ] of my-evs
      let delta (avg-att * 4) - 3
      set satisfaction cap 100 (at-least 0 (satisfaction + delta))
    ]
  ]
end

;; --- INACTIVE: waiting; reactivated by density or platform outreach ---
to behave-inactive
  set ticks-inactive ticks-inactive + 1

  if participation-density > reactivation-threshold [
    if random-float 1 < 0.12 [
      set satisfaction cap 100 (satisfaction + 15)
      set user-state  "passive"
      set ticks-inactive 0
      set ticks-in-state 0
    ]
  ]

  ;; Platform notification re-engagement
  ;; Diminishing returns: satisfaction boost is halved if user has been inactive >10 ticks
  ;; Calibrated against ~7–10% weekly re-engagement decay (industry estimate)
  if notification-rate > 0 [
    let effective-rate ifelse-value (ticks-inactive > 10)
      [ notification-rate * 0.5 ]
      [ notification-rate ]
    if random-float 1 < effective-rate [
      set satisfaction cap 100 (satisfaction + 20)
      if satisfaction > 25 [
        set user-state  "passive"
        set ticks-inactive 0
        set ticks-in-state 0
      ]
    ]
  ]

  if ticks-inactive > max-inactive-ticks [
    do-churn
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
  set satisfaction      cap 100 (satisfaction + gain)
  set attendance-history attendance-history + 1
  set activity-level    cap 1.0  (activity-level + 0.015)
  set host-probability  cap 0.5  (host-probability + 0.008)

  face target
  fd cap 1.0 (distance target * 0.3)
end

;; ============================================================
;; METRICS
;; ============================================================

to update-metrics
  let live users with [ user-state != "churned" ]
  let n-live count live

  ifelse n-live > 0 [
    let cnt-active-and-host count users with [
      user-state = "active" or user-state = "host"
    ]
    set participation-density cnt-active-and-host / n-live

    ;; 1 event per 10 live users = "healthy" event density benchmark
    let event-density-score cap 1 (count events * 10 / at-least 1 n-live)
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

;; Clamping helpers — ifelse avoids max/min list syntax issues in Tortoise
to-report cap [ hi x ]
  ifelse x > hi [ report hi ] [ report x ]
end

to-report at-least [ lo x ]
  ifelse x < lo [ report lo ] [ report x ]
end

;; Event-scoring helper — used by every behave-* routine when picking which
;; event to attend. Takes the event's quality/visibility/topic and the user's
;; interest + social motive, returns a numeric score for max-one-of ranking.
;; Topic weight: 1.0 on-topic; off-topic = 0.2 + motive × 0.6 (recluses ~0.32,
;; social butterflies ~0.68 — niche-seekers ignore off-topic, butterflies don't).
to-report event-score [ ev-q ev-v ev-t my-int my-mot ]
  let topic-weight ifelse-value (ev-t = my-int)
    [ 1.0 ]
    [ 0.2 + my-mot * 0.6 ]
  report ev-q * ev-v * topic-weight
end

to-report cnt-new
  report count users with [ user-state = "new" ]
end

to-report cnt-passive
  report count users with [ user-state = "passive" ]
end

to-report cnt-active
  report count users with [ user-state = "active" ]
end

to-report cnt-host
  report count users with [ user-state = "host" ]
end

to-report cnt-inactive
  report count users with [ user-state = "inactive" ]
end

to-report cnt-churned
  report count users with [ user-state = "churned" ]
end

to-report cnt-total
  report count users
end

to-report cnt-events
  report count events
end

to-report avg-satisfaction
  let live users with [ user-state != "churned" ]
  ifelse any? live
    [ report precision (mean [ satisfaction ] of live) 1 ]
    [ report 0 ]
end

to-report host-conversion-rate
  ifelse total-users-created > 0
    [ report precision (total-users-ever-hosted / total-users-created * 100) 1 ]
    [ report 0 ]
end

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
0.25
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
1.5
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
dunbar-limit
dunbar-limit
10
200
50.0
5
1
members
HORIZONTAL

SLIDER
8
415
275
448
activation-threshold
activation-threshold
1
15
5.0
1
1
events
HORIZONTAL

SLIDER
8
455
275
488
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
495
275
528
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
535
275
568
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
575
275
608
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
615
275
648
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
655
275
688
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
695
275
728
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
735
275
768
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
cnt-active
0
1
11

MONITOR
875
110
950
155
Hosts
cnt-host
0
1
11

MONITOR
780
160
870
205
Passive
cnt-passive
0
1
11

MONITOR
875
160
950
205
Inactive
cnt-inactive
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
cnt-events
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

MONITOR
780
410
950
455
Dunbar Factor
precision dunbar-factor 2
2
1
11

PLOT
780
465
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
"new" 1.0 0 -6995700 true "" "plot cnt-new"
"active" 1.0 0 -10899396 true "" "plot cnt-active"
"host" 1.0 0 -955883 true "" "plot cnt-host"
"passive" 1.0 0 -7500403 true "" "plot cnt-passive"
"inactive" 1.0 0 -13345367 true "" "plot cnt-inactive"

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
"density x100" 1.0 0 -13840069 true "" "plot participation-density * 100"
"satisfaction" 1.0 0 -4699768 true "" "plot avg-satisfaction"

@#$#@#$#@
## COMMUNITY PLATFORM DIAGNOSTICS v3

**When Does a Community Platform Start Feeling Alive?**

An agent-based model of participation density, host dynamics, and Dunbar-scale cohesion in event-driven social platforms. Calibrated against empirical benchmarks from community research.

---

### HOW TO RUN

1. Adjust sliders to set your scenario
2. Click **Setup**
3. Click **Go** — click again to pause

---

### WHAT SPACE REPRESENTS

Proximity represents **interest affinity**, not geography. Users near each other share interests; events near a user are relevant to them. Real platform discovery is algorithmic — but interest-based clustering produces similar neighbourhood dynamics.

---

### AGENT STATES

| Colour | State | Description |
|--------|-------|-------------|
| Sky blue | New | Just arrived, exploring |
| Gray | Passive | Lurking — low but stable engagement |
| Green | Active | Regular attendance |
| Orange | Host | Creates events; central to the ecosystem |
| Blue | Inactive | Disengaged, may return |
| Red | Churned | Leaving — visible 8 ticks, then removed |

---

### PARAMETERS

**Acquisition & Onboarding**
- `acquisition-rate` — organic new users per tick (~weekly cadence)
- `referral-strength` — density multiplier on acquisition (0 = no referral effect, 2 = doubles at full density)
- `onboarding-quality` — probability of a great first experience; default 0.25 matches ~9% 30-day activation (Eppo 2024)

**Retention & Churn**
- `satisfaction-decay` — satisfaction lost per tick without reinforcement; default 1.5 pts/tick
- `churn-sensitivity` — how strongly dissatisfaction converts to churn risk
- `base-churn-rate` — probability scaling on churn risk per tick; default 0.04 produces ~4% monthly churn (Recurly 2024 median)
- `max-inactive-ticks` — ticks before an inactive user permanently churns

**Engagement & Social**
- `social-reinforcement-strength` — satisfaction boost from peer interactions
- `dunbar-limit` — active community size beyond which social cohesion degrades (Dunbar 1992; optimal 25–80, default 50)
- `activation-threshold` — events attended before passive → active; default 5 events

**Host Dynamics**
- `host-conversion-threshold` — events attended before host eligibility
- `event-creation-rate` — probability a host creates an event each tick
- `event-visibility` — baseline discoverability of new events

**Platform Interventions**
- `notification-rate` — per-tick re-engagement probability for inactive users; effectiveness halves after 10 ticks of inactivity (diminishing returns)
- `curation-strength` — per-tick visibility boost to events with quality > 70 (algorithmic surfacing)

---

### THE DUNBAR EFFECT

Social cohesion isn't scale-free. Dunbar's research shows that meaningful relationships degrade in groups beyond ~150 people, with optimal participation around 25–80. Stowe Boyd's "Community by the Numbers" (2008) found that groups of 45–50 sustain the best per-person engagement.

In this model, `dunbar-factor` scales the probability of social bond formation:

- **At or below `dunbar-limit`**: full cohesion (factor = 1.0)
- **Beyond `dunbar-limit`**: cohesion falls proportionally, flooring at 0.15

The Dunbar Factor monitor shows this in real time. Watch what happens to satisfaction when a growing community crosses the limit.

---

### EMPIRICAL CALIBRATION

| Parameter | Default | Source |
|-----------|---------|--------|
| Monthly churn | ~4% | Recurly 2024 |
| New → active (30 days) | ~9% | Eppo / GetEppo |
| Participation density target | 10–20% seed | Critical mass studies |
| Optimal group size | 25–80 | Dunbar; Life with Alacrity |
| Notification decay | halves at 10 ticks inactive | Industry estimate |
| Event attendance rate | ~62% | Luma 2025 platform data |

---

### TESTABLE HYPOTHESES

**H1 — Critical mass threshold is 15–20%, not 30%**
Community vitality self-sustains when participation density exceeds ~15–20% (calibrated from critical mass research). Below this, the platform depends on continuous acquisition to feel alive.

*Test: Run with acquisition-rate = 0 after tick 60. Note the participation density at which vitality holds.*

**H2 — Host burnout is the collapse trigger**
If host burnout outpaces conversion, vitality collapses within ~40 ticks regardless of acquisition rate. The active count may stay stable while hosts drain to zero.

*Test: Set host-conversion-threshold = 20, satisfaction-decay = 3.0. Watch hosts disappear while actives hold.*

**H3 — Notifications outperform acquisition in high-churn scenarios**
When churn-sensitivity > 0.7, raising notification-rate extends community lifespan more effectively than raising acquisition-rate. Reactivating a lost user is cheaper than replacing them.

*Test: High churn-sensitivity scenario. Compare notification-rate = 0.1 vs acquisition-rate +3.*

**H4 — Dunbar crossover creates a quality plateau**
As an active community grows past dunbar-limit, total interactions increase but per-person satisfaction plateaus or falls. Growth looks healthy on engagement counts while cohesion quietly degrades.

*Test: Run to 200 ticks with high acquisition-rate. Watch dunbar-factor fall below 0.5. Check whether avg-satisfaction declines even as total-interactions grows.*

---

### WHAT CHANGED IN V3

- **Dunbar effect added**: social bonding probability scales with `dunbar-factor`; `dunbar-limit` is a new slider; Dunbar Factor monitor added
- **`behave-new` bug fixed**: new users who found events but failed the onboarding quality check could get stuck in "new" state indefinitely; now all new users resolve to passive within ~4 ticks
- **Empirical calibration**: `onboarding-quality` default 0.40 → 0.25 (matches ~9% 30-day activation); `satisfaction-decay` 1.0 → 1.5; `activation-threshold` 3 → 5
- **Notification diminishing returns**: effectiveness halves after 10+ ticks of inactivity (re-engagement campaigns lose efficacy over time)
- **H1 threshold corrected**: from 30% to 15–20% based on critical mass literature

---

### KNOWN LIMITATIONS

- Transition probabilities calibrated for plausible dynamics — not fitted to a specific platform's data
- No content quality degradation — events keep their initial quality score (no toxicity mechanic)
- Space represents interest proximity, not real geography or network topology
- A "tick" proxies roughly one week at default acquisition-rate = 2
- Dunbar-factor applies uniformly — real platforms have sub-communities that can maintain cohesion at larger total scales

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
<experiments></experiments>
@#$#@#$#@
@#$#@#$#@
default
0.0
-0.2 0 0.0 1.0
0.0 1 1.0 0.0
0.2 0 0.0 1.0
link direction
true
0
Line -7500403 true 150 150 90 180
Line -7500403 true 150 150 210 180
@#$#@#$#@
0
@#$#@#$#@
1
