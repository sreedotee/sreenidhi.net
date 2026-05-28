# Statewatch — Checkout Frames PRD

**Purpose:** 11 mobile UI frames, one per state in the verified checkout state machine. Final output attaches to states in Stately Studio so the machine diagram and its screens are a single inspectable artifact.

---

## 1. Why these exist

The checkout machine (`18-checkout-with-coupon-fixed.machine.js`) has 11 meaningful states, each verified by Alloy. Each state has exactly one UI — the frame inventory below is derived directly from the machine's state ids. Frame names must match state ids so Stately can attach them 1:1.

---

## 2. Design system

### Canvas
- Frame size: **390 × 844** (iPhone-class mobile portrait)
- Tool-agnostic: Figma, Framer, Sketch, or any design tool that can export PNG/JPG per frame

### Color tokens

| Token | Hex | Use |
|-------|-----|-----|
| `bg` | `#F6F7F9` | App background |
| `surface` | `#FFFFFF` | Cards, sheets, inputs |
| `surface-alt` | `#F1F3F5` | Thumbnails, subtle fills |
| `border` | `#E3E6EA` | Hairline dividers, input borders |
| `text` | `#0B1524` | Primary text |
| `text-muted` | `#6B7480` | Labels, captions, secondary text |
| `accent` | `#3B5BDB` | Buttons, links, focus (indigo-blue) |
| `accent-press` | `#2F49B0` | Pressed accent |
| `error` | `#E03131` | Decline banners, invalid states |
| `error-bg` | `#FFF0F0` | Error banner fill |
| `success` | `#2F9E44` | Confirmed, paid |
| `success-bg` | `#EBFBEE` | Success fill |
| `overlay` | `#0B1524` @ 50% | Modal / sheet scrim |
| `phone-body` | `#1a1a2e` | Phone chrome (dark navy) |

### Type (Inter throughout)

| Style | Size / weight | Use |
|-------|---------------|-----|
| `display` | 28 / SemiBold | Screen titles, order total |
| `title` | 20 / SemiBold | Section headers, card titles |
| `body-md` | 16 / Medium | Item names, button labels |
| `body` | 16 / Regular | Default text, input values |
| `label` | 13 / Medium | Field labels, muted captions |
| `mono` | 16 / Regular (tabular) | Card numbers, order #, amounts |

### Shared layout primitives

**Phone chrome** (wraps every frame):
- Phone body: 390 × 844, rounded corners, `phone-body` fill
- Screen inset: 12px left/right, 16px top — fills with `bg`
- Notch: centered pill, ~80 × 20px, darker than body

**Status bar** (top of every screen):
- Height: 20px, `bg` fill
- Left: "9:41" in `label` / `text`
- Right: simple battery icon (`success` fill)

**Top bar** (below status bar):
- Height: 56px, `surface` fill, 1px `border` bottom hairline
- Left: `‹` back chevron in `accent` — **omit on cart and success**
- Center: screen title in `title` / `text`
- Right: lock glyph + "Secure" in `accent`, small

**Content area:**
- 20px side padding, 16px vertical rhythm
- Cards: `surface` fill, 1px `border` stroke, 12px corner radius, shadow (y2 blur8 `text` @ 6%)
- Inputs: 52px tall, `surface`, 1px `border`, 10px radius, 14px horizontal padding, floating label in `label` / `text-muted`
- Active input border: `accent` 2px

**Bottom action bar** (pinned, most screens):
- `surface` fill, 1px `border` top hairline, 16px padding
- Primary button: full width, 52px tall, 10px radius, `accent` fill, white `body-md` label

**Home indicator:**
- 50 × 5px rect, centered, 20px from bottom of phone body, `surface` @ 30% opacity

### Cart items (placeholder, same across all frames)

| Color | Name | Price | Qty |
|-------|------|-------|-----|
| `#E7F5FF` | Linen crew tee | $38.00 | 1 |
| `#FFF3BF` | Canvas tote | $24.00 | 2 |
| `#FFE3E3` | Enamel mug | $16.00 | 1 |

Subtotal $102.00 · Shipping $6.00 · Tax $8.64 · **Total $116.64**

---

## 3. Frame inventory

### Frame 1 — `cart`
**State id:** `cart`
**Title:** "Cart"
**Back chevron:** no

Content:
- Three item cards, stacked. Each card: 56 × 56 color thumbnail (see cart items above) + item name (`body-md`) + price (`mono`) + qty stepper `[ − ] n [ + ]` right-aligned. Stepper: `surface-alt` bg, `border` stroke, 6px radius.
- Below items: hairline divider, "Subtotal" label left / "$102.00" right (`body` / `text-muted`)

Bottom bar: **"Review order"** → `REVIEW_CART` (gated by `hasItems`)

---

### Frame 2 — `reviewing`
**State id:** `reviewing`
**Title:** "Review order"
**Back chevron:** yes

Content (stacked cards):
- **Items card:** condensed 3-line list. Each line: 32 × 32 thumbnail + name + qty×price.
- **Ship to card:** "Sreenidhi · 14 Maple St, Austin TX 78701" with "Change" link (`accent`) top-right.
- **Totals card:** Subtotal $102.00 / Shipping $6.00 / Tax $8.64 / hairline / **Total $116.64** in `title`.
- "Apply coupon" text link (`accent`, centered) below totals card → `couponEntering`

Bottom bar: **"Pay $116.64"** → `PROCEED_TO_PAYMENT`

---

### Frame 3 — `paymentEntry`
**State id:** `paymentEntry`
**Title:** "Payment"
**Back chevron:** yes

Content (single card):
- **Card number** input — value `4242 4242 4242 4242` (`mono`), card brand glyph right
- **Expiry** input (half width) — value `12 / 28`
- **CVC** input (half width) — value `•••`
- **Name on card** input — value `Sreenidhi`
- **Billing address** sub-row: checkbox (checked, `accent` fill) + "Same as shipping" label

Bottom bar: **"Pay $116.64"** → `ENTER_PAYMENT`

---

### Frame 4 — `processing`
**State id:** `processing`
**Title:** "Payment"
**Back chevron:** **no** (in-flight — matches machine: no BACK event from processing)
**Bottom bar:** none

Content:
- Centered card (`surface`, 16px radius) in mid-screen
- 40px indeterminate spinner: `surface-alt` ring + `accent` arc, ~40px diameter
- Below spinner: "Processing payment" (`title` / `text`)
- Below that: "Don't close this window — this can take a few seconds." (`body` / `text-muted`, centered)

---

### Frame 5 — `threeDSecure`
**State id:** `threeDSecure`
**Title:** "Payment" (top bar visible behind scrim)
**Back chevron:** yes (behind scrim)

Content:
- Full processing screen dimmed behind `overlay` scrim
- **Bottom sheet** sliding from bottom: `surface`, rounded top 20px
  - Drag handle pill (`border`, centered)
  - "Your Bank · Verified by Visa" (`body-md` / `text`)
  - "We sent a code to •••• 4242" (`body` / `text-muted`)
  - 6-box OTP row: each box 40 × 40, `surface-alt` fill, `border` stroke, 6px radius; third box highlighted with `accent` 2px border (focus state)
  - Primary **"Verify"** button (`accent`)
  - "Cancel" text link (`text-muted`, centered) below button

Events: `3DS_SUCCESS` / `3DS_CANCELLED`

---

### Frame 6 — `declined`
**State id:** `declined`
**Title:** "Payment"
**Back chevron:** yes

Content:
- **Error banner** pinned above form: `error-bg` fill, 3px `error` left-side accent bar, 10px radius
  - "⚠ Card declined" (`body-md` / `error`)
  - "Your bank declined this charge (insufficient funds). Try another card." (`label` / `text-muted`)
- Same card form as Frame 3 (paymentEntry), but card number input has `error` 2px border

Bottom bar: **"Pay $116.64"** (retry) → `ENTER_PAYMENT`

---

### Frame 7 — `stockProblemDuringPayment`
**State id:** `stockProblemDuringPayment`
**Title:** "Payment" (behind scrim)
**Back chevron:** yes (behind scrim)

Content:
- Processing/payment screen dimmed behind `overlay` scrim
- **Centered dialog** (`surface`, 16px radius, ~280px wide):
  - Warning glyph (⚠, large, centered)
  - "An item is no longer available" (`title` / `text`)
  - "Canvas tote sold out while you were checking out. Remove it to continue, or cancel checkout." (`body` / `text-muted`, centered)
  - **"Remove & continue"** button (`accent`) → `REMOVE_OOS_ITEMS`
  - **"Cancel"** ghost/text button → `BACK`

---

### Frame 8 — `success`
**State id:** `success`
**Title:** "Order placed"
**Back chevron:** **no**

Content (centered, no bottom action bar pinned — uses extended bottom bar):
- `success-bg` circle, 72px, with `success` checkmark glyph inside
- "Payment confirmed" (`display` / `text`, centered)
- "Order #SW-4821" (`mono` / `text-muted`, centered)
- **Summary card:**
  - "3 items · Total paid" (`label` / `text-muted`) + **$116.64** (`title` / `text`) right-aligned
  - "Receipt emailed to sreenidhi.dev@gmail.com" (`label` / `text-muted`)

Bottom bar (2 stacked):
- **"View receipt"** primary (`accent`) → `VIEW_RECEIPT`
- **"Continue shopping"** text link (`accent`) → `START_OVER`

---

### Frame 9 — `couponEntering`
**State id:** `couponEntering`
**Title:** "Review order" (top bar, visible behind scrim)
**Back chevron:** yes (behind scrim)

Content:
- Reviewing screen dimmed behind `overlay` scrim
- **Bottom sheet** from bottom: `surface`, rounded top 20px
  - Drag handle pill
  - "Add a coupon" (`title` / `text`, centered)
  - **Coupon code** input (`mono`, uppercase) — value `GIFT20`, placeholder "Enter code". `accent` 2px border (focused).
  - **"Apply"** button (`accent`) → `SUBMIT_COUPON`
  - "Cancel" text link (`text-muted`, centered) → `CANCEL_COUPON`

---

### Frame 10 — `couponValidating`
**State id:** `couponValidating`
**Title:** same as couponEntering
**Back chevron:** yes (behind scrim)

Content:
- Same coupon bottom sheet, but:
  - Coupon code input disabled (reduced opacity, `surface-alt` fill)
  - Apply button shows inline spinner (small `surface` arc on `accent` bg) + "Checking…" label, non-interactive (opacity 0.7)
  - "Cancel" text link non-interactive (opacity 0.4)

This is a transient state — the frame documents the loading moment.

---

### Frame 11 — `couponInvalid`
**State id:** `couponInvalid`
**Title:** same as couponEntering
**Back chevron:** yes (behind scrim)

Content:
- Same coupon bottom sheet, but:
  - Coupon code input has `error` 2px border, `error-bg` fill
  - Field label in `error`
  - Error text below input: "Coupon code is invalid." (`label` / `error`)
  - **"Try again"** button (`accent`) → `RETRY_COUPON` (returns to `couponEntering`)
  - "Cancel" text link → `CANCEL_COUPON`

---

## 4. Stately embed requirements

Stately Studio attaches frames to states as URLs (image or design tool embed). The attachment point is the state id.

**Naming convention for exported frames:**
- File name = state id exactly: `cart.png`, `reviewing.png`, `paymentEntry.png`, etc.
- Format: PNG, minimum 390 × 844px, 2× (@2x) preferred
- Transparent background outside phone chrome is fine; solid `bg` fill also works

**State id → frame mapping:**

| State id | Frame # |
|----------|---------|
| `cart` | 1 |
| `reviewing` | 2 |
| `paymentEntry` | 3 |
| `processing` | 4 |
| `threeDSecure` | 5 |
| `declined` | 6 |
| `stockProblemDuringPayment` | 7 |
| `success` | 8 |
| `couponEntering` | 9 |
| `couponValidating` | 10 |
| `couponInvalid` | 11 |

**States intentionally omitted** (no distinct UI beyond existing variants):
- `stockCheck` — transient, no visible UI change
- `paymentReady` — folded into `paymentEntry`
- `networkError` — retry banner variant of processing (build if needed later)
- `sessionLost` — full-screen "Session expired" dialog (build if needed later)
- `receipt` — extended line-item version of success (build if needed later)

---

## 5. Handoff notes

- All 11 frames share the same phone chrome, status bar, and top bar — build these as a shared component/master frame and override per state.
- Overlay states (threeDSecure, stockProblemDuringPayment, couponEntering, couponValidating, couponInvalid) dim the parent screen behind a scrim — the parent content is visible at 50% opacity behind the sheet/dialog. Use the relevant parent frame as the base layer.
- The spinner (frames 4 and 10) is a static representation of a loading arc — no animation needed for Stately embeds, just a partial arc suggesting motion.
- Cart item thumbnail colors are purely decorative placeholder fills — no actual product imagery required.
