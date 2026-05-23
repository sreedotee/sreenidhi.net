# sreedotee Portfolio — Agent Handoff

A consolidated brief so a fresh agent can pick up work on Sreenidhi's portfolio recreation without re-deriving context. Built from auto-memory as of 2026-05-23.

**Location:** `C:\Users\sreen\sreedotee-recreation\`
**Dev server:** `http://localhost:5173/` (Vite)
**Reference site:** `https://sreedotee.framer.website/` (the OG being replaced)
**User email:** `sreenidhi.dev@gmail.com`

---

## 1. Who you're working with

Sreenidhi is a designer who thinks like an engineer. **Not** typical UX/visual-first. She's drawn to:

- **Structural decomposition** — irreducible parts (Christopher Alexander, Daniel Jackson)
- **Formalism** — making fuzzy things rigorous (state machines, concept design, formal verification)
- **Systems thinking** — local rules → global behavior (agent-based modeling, complexity)
- **Mathematical thinking** — category theory, graph theory, lattice/set theory applied to IA
- **Simulation over A/B testing** — predicting design impact before shipping

Theoretical grounding: Christopher Alexander (*Notes on the Synthesis of Form*, *A Pattern Language*), Daniel Jackson (*The Essence of Software*), Melanie Mitchell (*Complexity*), Hofstadter (*GEB*), Eugenia Cheng (*The Joy of Abstraction*), graph theory, network science, ABM, system dynamics, formal methods.

**Collaboration style:**
- Pushes back hard when you're wrong. Prefers precision over encouragement.
- Don't soften, don't pad. Don't write generic UX/marketing copy in her portfolio — it actively misrepresents her.
- "go on" / "yes do it" = execute, don't ask for confirmation on small things.
- "let me check" / "wait" = pause.
- Gets annoyed when you execute things she only wanted listed. When asked for a plan/list, just list — don't start doing.

---

## 2. Copy & visual vibe rules (READ BEFORE WRITING ANYTHING)

### Copy

- **Subtle, not on-the-nose.** Don't declare the engineer-mindset / structural-thinking positioning explicitly. Let the work say it. Words like "rigor", "formalize", "structural" in copy = too obvious. Better: hint at curiosity, taste, care. Depth shows through case studies, not taglines.
- **Don't make it her whole personality.** No manifesto-feel. She's not branding herself as "The Structural Designer." Positioning is *felt*, not announced.
- **Don't go too esoteric either.** She needs to get hired. Brautigan-leaning copy ("all watched over by machines of loving grace") is too far. Lines like "Design for the internet, built with intention" hit the right balance — taste-signaling without being weird.
- Why: her old site overdid the manifesto-feel AND she can't go fully poetic because recruiters need to read it. **Middle path: simple, confident, intentional.**

### Vibes are aura, not literal motifs

Sreenidhi's "hopecore + Frutiger Aero + technical-mystical + engineering precision" isn't a request for literal imagery from each. It's a request that the *feel* of those things comes through.

- Example: the Meraki font itself carries the "loving grace" feeling — no actual hopecore imagery needed. The type *is* the vibe.
- Build vibes through **registers** (type pairing, color palette, restraint, pacing, motion), NOT by importing literal motifs from each aesthetic. Layering literal Frutiger bubbles + literal mystic sigils + literal halftone constellations will visually fight.
- Current site already nails this in part: Meraki = warmth, Geist = precision, silk-blue gradient = sky/Frutiger nod, sharp corners + white space = restraint. Adding ONE more vibe-carrier is fine; layering literal versions of every reference is over-decoration.

### Aesthetic targets

- **Frutiger Aero** — early-2000s aqua/glassy/optimistic web. Sky blues, translucent UI, soft glows, bubble/orb motifs.
- **Light blues, lots of them.** Big love for light-blue tones right now. Expand beyond just the silk hero gradient — work this into more sections.
- **Hopecore / techno-optimism** — "All Watched Over by Machines of Loving Grace" (Brautigan). Romantic about the internet, utopian.
- **Technical-mystical** is THE visual target. Moodboard refs at `public/moodboard/myst*.jpg`. Through-line:
  - **Schematic/blueprint linework** — engineering drawings, swiss-grid technical diagrams, Christopher-Alexander-pattern-library energy (`myst.jpg`, `myst2.jpg`, `myst4.jpg`)
  - **Scientific-paper-meets-mystical-content** — swiss typography + cosmological/esoteric subject matter, academic rigor (`myst3.jpg` — singularities, communication, possibility, "moledules", stone heads + oscilloscope waveforms)
  - **Illuminated-manuscript sigils** — thorny calligraphic flourishes (crosses, crescents, swords) on silver/gray gradients, hand-drawn but technically precise (`myst6.jpg`)
  - **Halftone dots + soft blue/cyan/coral accents** — contemporary digital-spiritual (`myst7.jpg`)
  - **Loose hand-drawn crowd outlines + topographic noise** — intuition pole, opposite of schematic (`myst5.jpg`)
  - **Common DNA:** black-on-white precision linework + halftone dot textures + selective light-blue accents + occasional sigil/schematic flourish. Two registers (rigid + flowing) of one aesthetic.
- **Glass surfaces (liquid-dom)** were considered — REJECTED for site-wide use because the library requires an experimental Chrome flag, breaks for most visitors. Use standard CSS `backdrop-filter` for surgical glass moments only.

### Tension

She wants sharp corners everywhere (no border-radius). Frutiger Aero typically uses rounded/glossy. **Compromise:** keep sharp corners; get the Frutiger feel through color palette + translucent/glass effects + soft gradients, NOT through rounded geometry.

### How to apply

Default to soft, hinting copy. Default to light-blue / aqua / silk palette extensions. Default to translucent overlays and gradient washes. When proposing aesthetic moves, frame them as "softer / more hopeful" rather than "more structural / rigorous."

---

## 3. Working-style rules (DON'T REPEAT PAST MISTAKES)

### Don't reason from folder structure

Don't make design/UX recommendations based on folder names or routes without verifying they're part of the current design. Old iterations leave behind dead route folders that look real but aren't active.

- **Why:** I once recommended nav items like "What I Do · Play" based on the presence of `/what-i-do/`, `/play/`, `/about/`, `/contact/` folders. User corrected: those were dead code from the older site — the redesign was single-page. Treat folder names as hints, not facts.
- **How to apply:** Before recommending nav items, page structures, or features based on routes/folders, either (a) ask the user what's actually part of the current design, or (b) check active imports, the index/landing page, and current dev-server behavior.

### Inspect, don't eyeball

When matching typography, spacing, or any precise visual value from a live reference site, drive a headless browser (puppeteer) to read computed styles directly. Don't estimate from screenshots.

- **Why:** I once eyeballed sizes from screenshots and was off by 40-50%: guessed 13px for nav (actual 20px), 13px for hero intro (actual 20px), 92-112px for hero h1 (actual exactly 96px). Headless inspection of `getComputedStyle()` gave precise numbers in one pass.
- **How to apply:** Before fudging sizes: (1) check if the reference is a live URL, (2) if yes, write a quick puppeteer script at 1440px viewport and dump computed styles grouped by unique (fontFamily, fontSize, fontWeight, lineHeight, letterSpacing). The template `reference/inspect-typography.mjs` is reusable.

---

## 4. Tech stack

- **Vite** (vanilla HTML/CSS/JS, no framework)
- **Lenis** for smooth scroll (`npm install lenis`, imported in `src/main.js`, duration 1.15)
- Self-hosted **Meraki** (regular OTF only — italic synthesized) + **Geist** + **Geist Mono** (Google Fonts)
- No build-time templating; each route is a hand-written `index.html`

---

## 5. File structure

```
C:\Users\sreen\sreedotee-recreation\
├── index.html                              # Homepage (single-page scroll)
├── about/index.html                        # About page
├── projects/
│   ├── atelia/index.html
│   ├── tofha/index.html
│   ├── whering/index.html
│   ├── golden-group/index.html
│   └── sku-coverage/index.html
├── play/
│   └── lootbox-economics/index.html        # Most recent build (system-dynamics sim)
├── preview/index.html                      # Mid-decision: 3 layout options chooser
├── preview-a/                              # Dense home, one scroll
├── preview-b/                              # Hero + dashboard band
├── preview-c/                              # Magazine-style index page
├── src/
│   ├── styles.css                          # Single stylesheet for entire site
│   ├── main.js                             # Lenis, carousel, footer reveal, etc.
│   └── lootbox.js                          # Loot Box Economics sim logic
├── public/
│   ├── og-assets/                          # Downloaded OG images + videos (~22MB)
│   ├── moodboard/                          # myst*.jpg refs + trifecta.jpeg
│   └── fonts/                              # Meraki OTF
├── reference/                              # Inspection scripts + reference JSON
└── vite.config.js
```

---

## 6. Homepage sections (in order)

1. **Hero** — silk-gradient background, `Attention is currency. / I make things that earn it.` h1, intro paragraph + Let's Talk / View work CTAs. Symmetric 76px/32px padding (vertical content centering). Grid `translateX(-60px)` to sit 60px left of body content.
2. **Selected Work** (`#work`) — 100vh, sticky head tucks on scroll. Left index (5 projects: Atelia, Tofha, Whering, Golden Group, SKU Coverage) + right carousel. Autoplay 2.8s, seamless forward loop (clone trick). Hover index = preview that slide; mouseleave = return to natural position. Index links + slide-image link to `/projects/<slug>/`.
3. **Creative Coding** (`#creative`) — `height: auto` (not 100vh). Right-aligned "Creative Coding" heading in Meraki 64px. Table-style rows: Cloud Nine / Horsin' Around / Interactive Globe, each with hover-preview image that pops in from the right.
4. **Play** (`#play`) — 100vh, central-image + 4-thumbnail viewer. Items: **Statewatch** (formalism tool), **Community Platform Diagnostics** (agent-based model), **Loot Box Economics** (system dynamics), **Essays** (writing). Thumbnails still picsum placeholders pending real screenshots.
5. **Tools I Use** (`#tools`) — eyebrow + phonetic + horizontal marquee of 8 OG-downloaded tool logo SVGs (251×159 each, 8px gap, 16px padding, multiply-blend bg). Pauses on hover. Logos not yet labeled — alt is "Tool 1" etc.
6. **Testimonials** (`#testimonials`) — paper-bg card. Quote mark top-left (Meraki italic 90px), pagination top-right (`— 001/003`, 96px bar), quote (Geist 36px/43.2px), prev/next arrows bottom-left, name bottom-right (Meraki 40px). Three real quotes (Akansha Soni / Manthan Ugemuge / Namira Khan).
7. **Trifecta closing** (`#trifecta`) — 65vh. "Design is the synthesis. It lives at the intersection of technology, business, and culture." Uses `public/moodboard/trifecta.jpeg` with `mix-blend-mode: multiply` as placeholder diagram. Padding 80/32/120 (top needs 80 for footer clearance).
8. **Fixed footer** (`.A-foot`) — bottom bar with `© 2026` + LinkedIn/Instagram/Substack icons. Solid white bg, 16px Geist 500 #a3a3a3, padding 20px. Lenis-aware paper-pull-up animation when trifecta enters viewport.

---

## 7. Custom interactions (all in `src/main.js`)

- **Sticky-head tuck** — on `.A-section` enter, scroll position drives a `--tuck: 0→1` CSS variable that interpolates head title size (60→22), lede size (18→13), gap, opacity. Smooth per-scroll-frame, not class toggle.
- **Carousel hover-preview** — mouseenter on `.work-index` saves current position, pauses autoplay, hovering items animates carousel to that index; mouseleave restores saved position and resumes autoplay.
- **Seamless forward carousel loop** — first slide cloned + appended; on reaching the clone, snap back to position 0 with no animation after the 720ms transition completes.
- **Cursor-fill on Creative-Coding ornaments** — each engraved SVG wrapper has a `<radialGradient>` whose `cx`/`cy` update on `mousemove` so the colored fill (masked to the engraved shape via `mask-type="alpha"`) intensifies near the cursor.
- **Engraved-on-white technique** — SVG `<image>` of a moodboard JPG is filtered with `feColorMatrix` that inverts luminance to alpha (dark areas → opaque white shapes), then a soft offset drop-shadow (0 1.5px 1px rgba(4,8,61,0.11)) casts the visible "ghost" of the diagram. Reads as recessed/engraved.
- **Paper-pull-up footer** — scrolling into trifecta drives footer's `translateY` via lerped damping (factor 0.11) toward a scroll-derived target. A `--lift: 0→1` CSS variable, scaled across pull distance, drives an inset hairline (`box-shadow: inset 0 1px 0 rgba(4,8,61,calc(var(--lift)*0.22))`) that progressively appears as footer lifts.
- **Topbar transparency** — IntersectionObserver on the hero. Topbar transparent while hero in view, glass-frosted (backdrop-filter blur) once scrolled past.

---

## 8. Design system

- **Colors:** `--navy: #04083d` primary; `--white: #ffffff`; silk-blue palette `#cfdcf6 → #b6c8ee` for hero gradient
- **Type:** Meraki serif for headlines + accents (italic synthesized for fancy quote marks); Geist sans for body/UI; Geist Mono for pagination
- **Spacing rhythm:** 32px top / 120px bottom on every section (asymmetric — content lands, breathes downward). Hero exception: 76/32 symmetric. Trifecta exception: 80/120 (top needs 80 for footer clearance).
- **Section content max-width:** `var(--max) = 1320px`, margin: 0 auto, with section padding 32px sides.
- **Sharp corners everywhere** — no border-radius (user's explicit rule).
- **Body bg:** white. No section bg tints (user rejected this — said it was too drastic a shift).

---

## 9. Inspection scripts

All in `reference/`. Useful templates:
- `inspect-typography.mjs` — computed styles via puppeteer at 1440x900
- `inspect-sections.mjs` — section overflow at multiple viewports
- `extract-testimonials.mjs` — cycles a carousel to capture all slides
- `capture-silk.mjs` — WIP, attempts to grab the OG silk shader bare (currently produces blank white — selector issue, needs the foreground-hiding selectors fixed)

**Always inspect OG before estimating sizes — eyeballing is consistently wrong** (see §3).

---

## 10. What's been done

1. ✅ **Play section experiments** — replaced shader/loader/globe items with rigor experiments: Statewatch (Formalism Tool), Community Platform Diagnostics (Agent-Based Model), Loot Box Economics (System Dynamics), Essays (Writing). Thumbs are picsum placeholders pending real screenshots. Lede updated to "Tools, simulations, and writing — what I work through outside the brief."
2. ✅ **Project page copy** — real copy in all 5 detail pages.
   - **Whering** got the substantive case study: Daniel Jackson formal concept analysis, 8 orthogonal concepts, 8 synchronizations mapped before screens were drawn.
   - **Tofha / Golden Group / SKU Coverage** got plausible, non-placeholder copy.
   - **Atelia** was already done.
3. ✅ **Loot Box Economics play page** — `play/lootbox-economics/index.html` + `src/lootbox.js` (system-dynamics simulation logic)
4. 🟡 **Three layout-preview routes (`/preview/`, `/preview-a/`, `/preview-b/`, `/preview-c/`)** — built for user to compare three IA options for the home page. **Mid-decision: user needs to pick A/B/C or tell agent to mix.** Per user's latest input ("forget previews"), this may be deprioritized — confirm before doing more work here.

---

## 11. Remaining tasks (in priority order)

### 3. About page polish
`/about/index.html` currently has the 3-paragraph OG-style content (bigprose + two paragraphs). May want extension: closing line, list of interests, "currently working on" mention, or just leave minimal. **Ask user direction.**

### 4. Hero silk gradient — exact match to OG
Current `.silk` CSS is an approximation (linear-gradient + radial highlight + ::before/::after fold layers). OG uses a Framer WebGL silk shader. Options:
- Refine CSS gradient colors based on OG screenshot (best for token efficiency)
- Use a static high-res screenshot of the OG silk as background-image (exact but loses animation)
- Port the shader (highest effort, exact + animated)
- Fix `reference/capture-silk.mjs` (already written, needs the foreground-hiding selectors fixed — previous attempt produced blank white image)

### 5. Illustrations
Need direction from user before building. Possibilities:
- Refined vector glyphs in the myst-board register (engraved technical-mystical)
- Custom per-section diagrams (similar to the orbital / sine wave / network graph SVGs we built earlier and replaced)
- Section-specific decorative elements

Reference the technical-mystical aesthetic guidance in §2.

### 6. Contact page
Not built yet. Need full list of links from user before building. Currently the nav's "Contact" link is `mailto:sreenidhi.dev@gmail.com`. Likely needs: LinkedIn, Instagram, Substack (already in footer), plus possibly Twitter/X, Read.cv, GitHub, email. Will be a single-page route at `/contact/` mirroring the layout of `/about/`.

### 7. Favicon + social sharing image
Need source asset from user. Options: a sigil/glyph mark (matches the technical-mystical aesthetic), her initials in Meraki, or something else she designs. Once asset is provided, generate the standard set (favicon.ico, apple-touch-icon, og-image at 1200×630) and wire `<meta>` tags into every page.

---

## 12. Open questions / undecided

- **Tool logos** still labeled "Tool 1", "Tool 2" etc. in alt text. User hasn't identified which OG logo is which tool yet. When known, reorder + update alt text.
- **Tofha carousel slide image** is still picsum (OG didn't have Tofha — it's a 2026 project).
- **Trifecta diagram** is `trifecta.jpeg` placeholder with old labels (DESIGN / STRATEGY / TECHNOLOGY) — user explicitly said ignore this mismatch, it's a mock.
- **Home page video** (`public/og-assets/DVZ23SsUsC8sY0Yx4Xu7QxWNB0.mp4`) downloaded but not placed anywhere on the recreation yet.
- **Preview routes A/B/C** — user said "forget previews" in latest session; confirm before deleting or continuing.

---

## 13. How to apply when picking up

1. **Read this whole doc before doing anything.** Especially §1, §2, §3.
2. **Pick a task from §11.** Don't start without user confirmation when the task says "ask user direction" / "need direction" / "need full list."
3. **Don't undo completed work in §10** (it's all approved by user).
4. **Inspect OG computed values before applying sizes/spacing.** Reuse existing JSON in `reference/` instead of re-inspecting where possible.
5. **Batch edits** — the project file count is small, token usage adds up fast.
6. **When unsure about copy vibe, lean subtle.** When unsure about visual vibe, lean light-blue + restrained.
