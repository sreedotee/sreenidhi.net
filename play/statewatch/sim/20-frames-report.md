# Statewatch — Checkout Frames: generation report

**Date:** 2026-05-26
**Target:** Figma file "Statewatch — Checkout Frames", 11 state frames, attachable in Stately Studio.
**Status:** ⛔ **BLOCKED — could not create the Figma file.** No Figma URL was produced. The full design spec below is execution-ready for when the blocker is cleared.

---

## 1. The blocker

The connected Figma account (`sreenidhi.dev@gmail.com`, handle "Sreenidhi") has a single plan:

| Field | Value |
|-------|-------|
| Plan  | "Sreenidhi's team" |
| Tier  | `starter` |
| Seat  | **View** (`seat_type: view`) |
| planKey | `team::1515693227580796514` |

A **View seat** is read-only. It cannot create or edit Figma files. On a **Starter** plan it is also capped at **6 MCP tool calls/month**.

`create_new_file` was attempted twice and failed both times:

- planKey `team::1515693227580796514` (verbatim from `whoami`) → `Invalid planKey`
- planKey `team:1515693227580796514` (single-colon, per skill docs) → `Invalid planKey`

The error is consistent with the seat type: a View/Starter seat has no plan target it is permitted to create files in, so the key is rejected. `use_figma` (the design-writing tool) would fail for the same reason even if a file existed.

**This is not a transient rate-limit.** It is a seat-permission ceiling.

### How to unblock
Upgrade the Figma account to a **Full** or **Dev** seat on a **Professional** (or higher) plan. Then re-run this session — the spec below is written so the frames can be built top-to-bottom without further design decisions.

---

## 2. Design system spec (ready to build)

A single, consistent design language across all 11 frames. **Mobile portrait**, 390 × 844 (iPhone-class), because the flow is transactional and single-column — the Stripe Checkout / Shopify mobile aesthetic.

### Color tokens (Figma variable collection "tokens", mode "default")
Values are sRGB hex; Figma plugin API needs 0–1 floats (hex/255).

| Token | Hex | Use |
|-------|-----|-----|
| `bg`           | `#F6F7F9` | App background (cool light gray) |
| `surface`      | `#FFFFFF` | Cards, sheets, inputs |
| `surface-alt`  | `#F1F3F5` | Item thumbnails, subtle fills |
| `border`       | `#E3E6EA` | Hairline dividers, input borders |
| `text`         | `#0B1524` | Primary text (near-black navy) |
| `text-muted`   | `#6B7480` | Secondary text, labels, captions |
| `accent`       | `#3B5BDB` | Primary buttons, links, focus (indigo-blue) |
| `accent-press` | `#2F49B0` | Pressed/active accent |
| `error`        | `#E03131` | Decline banners, invalid states |
| `error-bg`     | `#FFF0F0` | Error banner background |
| `success`      | `#2F9E44` | Confirmation, paid badge |
| `success-bg`   | `#EBFBEE` | Success banner background |
| `overlay`      | `#0B1524` @ 50% | Modal scrim |

### Type scale (Inter — preloaded in Figma)
| Style | Size / line / weight | Use |
|-------|----------------------|-----|
| `display`  | 28 / 34, Semi Bold | Screen titles, order total |
| `title`    | 20 / 26, Semi Bold | Section / card headers |
| `body`     | 16 / 22, Regular | Default text, input values |
| `body-md`  | 16 / 22, Medium | Item names, button labels |
| `label`    | 13 / 18, Medium | Field labels, muted captions |
| `mono`     | 16 / 22, Regular (use Inter, tabular) | Card number, order #, amounts |

### Layout primitives
- Outer screen: 390 × 844, fill `bg`.
- **Top bar:** 56 tall, surface fill, hairline bottom border. Left: back chevron (skip on Cart/Success). Center: step title. Right: lock glyph + "Secure".
- **Content:** 20px side padding, 16px vertical rhythm, cards with 16px inner padding and 12px corner radius, 1px `border` stroke, soft shadow (y2, blur8, `#0B1524` @ 6%).
- **Bottom action bar:** pinned, surface, top hairline, 16px padding. Holds the primary button (full width, 52 tall, 10 radius, `accent` fill, white `body-md` label).
- **Input:** 52 tall, surface, 1px `border`, 10 radius, 14px horizontal padding, `label` floating/topped label.
- All frames share top bar + content + (where relevant) bottom bar so they read as one product.

---

## 3. The 11 frames (one per state in the verified machine)

Source machines: `12-checkout-verified.machine.js` (base) and `18-checkout-with-coupon-fixed.machine.js` (coupon block). Frame names match the machine's state ids so they map 1:1 in Stately Studio.

Placeholder cart items (3): colored thumbnail rect + name + price.
1. `#E7F5FF` — "Linen crew tee" — $38.00 — qty 1
2. `#FFF3BF` — "Canvas tote" — $24.00 — qty 2
3. `#FFE3E3` — "Enamel mug" — $16.00 — qty 1
Subtotal $102.00, shipping $6.00, tax $8.64 → **total $116.64**.

### 1. `cart` — Cart
Title "Cart". Three item cards, each: 56×56 thumbnail (token color), name (`body-md`), price (`mono`), and a qty stepper `[ − ] n [ + ]` on the right. Below items: subtotal row ("Subtotal — $102.00", muted). Bottom bar primary button **"Review order"**. (Maps to `REVIEW_CART`, gated by `hasItems`.)

### 2. `reviewing` — Reviewing
Title "Review order". Stacked summary cards:
- **Items** card: condensed 3-line item list (thumbnail 32px + name + qty×price).
- **Ship to** card: name + address ("Sreenidhi · 14 Maple St, Austin TX 78701"), small "Change" link.
- **Totals** card: Subtotal $102.00, Shipping $6.00, Tax $8.64, hairline, **Total $116.64** (`title`).
- "Apply coupon" text link (`accent`) above totals → enters coupon flow.
Bottom bar primary **"Pay $116.64"**. (Maps to `PROCEED_TO_PAYMENT`; "Apply coupon" → `couponEntering`.)

### 3. `paymentEntry` — PaymentEntry
Title "Payment". Card-detail form on surface:
- **Card number** input with brand glyph, value `4242 4242 4242 4242` (`mono`).
- Row: **Expiry** `12 / 28` | **CVC** `•••`.
- **Name on card** input "Sreenidhi".
- **Billing address** sub-card (collapsed summary "Same as shipping" with checkbox checked).
Bottom bar primary **"Pay $116.64"**. (Maps to `ENTER_PAYMENT` → `paymentReady`; the design folds paymentEntry/paymentReady into one screen since they share UI.)

### 4. `processing` — Processing
Centered, no bottom bar. Surface card with a 40px indeterminate **spinner** (accent arc on `surface-alt` ring), `title` "Processing payment", `body-muted` "Don't close this window — this can take a few seconds." Top bar back chevron **hidden** (in-flight is sacred — matches machine: no BACK). (State `processing`.)

### 5. `threeDSecure` — ThreeDSecure
The processing screen dimmed behind a 50% `overlay` scrim, with a **bank verification sheet** sliding from bottom: rounded-top surface sheet, faux bank header ("Your Bank · Verified by Visa" with small bank logo block), `body` "We sent a code to •••• 4242", a 6-box OTP input row, and a full-width `accent` **"Verify"** button. Small "Cancel" link below. (Maps to `3DS_SUCCESS` / `3DS_CANCELLED`.)

### 6. `declined` — Declined
Same layout as PaymentEntry, but with an **error banner** pinned above the form: `error-bg` fill, `error` left border (3px), alert glyph, title "Card declined" (`body-md`, `error`), and reason line "Your bank declined this charge (insufficient funds). Try another card." Form fields shown again, retry-ready. Bottom bar primary **"Pay $116.64"** (retry). (Maps to `declined`: `ENTER_PAYMENT` retry / `BACK`.)

### 7. `stockProblemDuringPayment` — StockProblemDuringPayment
Interrupting modal over a dimmed payment screen. Centered surface dialog: warning glyph, `title` "An item is no longer available", `body-muted` "**Canvas tote** sold out while you were checking out. Remove it to continue, or cancel checkout." Two stacked buttons: primary `accent` **"Remove & continue"** (→ `REMOVE_OOS_ITEMS`), secondary ghost **"Cancel"** (→ `BACK`). (State `stockProblemDuringPayment`.)

### 8. `success` — Success
No top-bar back. Centered **success check** in a `success-bg` circle (`success` checkmark), `display` "Payment confirmed", `mono` "Order #SW-4821". Summary card: item count + **Total paid $116.64**, and a `body-muted` line "Receipt emailed to sreenidhi.dev@gmail.com." Bottom bar: primary **"View receipt"** (→ `VIEW_RECEIPT`) + ghost "Continue shopping" (→ `START_OVER`). (State `success`.)

### 9. `couponEntering` — CouponEntering
Coupon entry presented as a bottom sheet over a dimmed Reviewing screen (or full screen — sheet preferred). Sheet header `title` "Add a coupon". Single **coupon code** input (`mono`, uppercase, value "GIFT20", placeholder "Enter code"). Two buttons: primary `accent` **"Apply"** (→ `SUBMIT_COUPON`), ghost **"Cancel"** (→ `CANCEL_COUPON` back to reviewing). (State `couponEntering`.)

### 10. `couponValidating` — CouponValidating
Same coupon sheet, but the Apply button shows an **inline spinner** and the row below reads, with a small spinner glyph, `body-muted` "Checking coupon…". Input is disabled (reduced opacity). Buttons non-interactive. (State `couponValidating` — transient.)

### 11. `couponInvalid` — CouponInvalid
Coupon sheet with an **error row** under the input: `error` text "Coupon code is invalid." (or, for the network-timeout path, "Couldn't reach the server — try again."). Input border switches to `error`. Buttons: primary **"Try again"** (→ `RETRY_COUPON` back to entering) + ghost **"Cancel"** (→ `CANCEL_COUPON`). (State `couponInvalid`.)

> Note: the machine also defines `stockCheck`, `paymentReady`, `networkError`, `sessionLost`, and `receipt`. The 11 requested frames intentionally fold `stockCheck`→(transient, no distinct UI), `paymentReady`→`paymentEntry`, and omit `networkError`/`sessionLost`/`receipt`. If those need frames later, `networkError` ≈ a retry banner variant of Processing, `sessionLost` ≈ a full-screen "Session expired — resume?" dialog, `receipt` ≈ a detailed line-item version of Success.

---

## 4. Aesthetic decisions (summary)
- **Palette:** cool-gray background, white surfaces, single **indigo-blue accent (`#3B5BDB`)**, red/green reserved strictly for error/success. Professional, payment-grade, low-chroma — Stripe Checkout lineage.
- **Type:** Inter throughout; Semi Bold for titles/totals, tabular-feeling Inter for amounts/card/order numbers.
- **Layout:** mobile portrait 390×844, single column, shared top bar + pinned bottom action bar, 12px-radius cards with hairline borders and a soft shadow. Modals/sheets for 3DS, stock interrupt, and the coupon sub-flow so the parent state stays visible behind the scrim — mirroring how these are overlay states in the machine.

## 5. Issues encountered
1. **Figma View/Starter seat cannot create or edit files** — the sole blocker. Two planKey formats rejected with `Invalid planKey`. No file, no frames, no URL produced.
2. Mobbin not authenticated (expected per brief) — design drew on Stripe/Shopify/Apple Pay patterns from training instead.
3. No design decisions remain open: the spec above is sufficient to build all 11 frames in one pass once a Full/Dev seat is available.

---

**Figma file URL:** none — file creation blocked by seat permissions (see §1).
