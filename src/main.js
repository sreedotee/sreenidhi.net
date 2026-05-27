/* ----- Smooth scroll via Lenis — adds inertia/easing to the native scroll;
       all existing scroll listeners (tuck, footer pull, IntersectionObservers) continue to fire normally ----- */
import Lenis from 'lenis'
import { initSilk } from './silk.js'

const silkCanvas = document.querySelector('.A-hero canvas.silk')
if (silkCanvas) initSilk(silkCanvas)

const lenis = new Lenis({
  duration: 1.15,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  smoothTouch: false,
})
function lenisRaf(time) {
  lenis.raf(time)
  requestAnimationFrame(lenisRaf)
}
requestAnimationFrame(lenisRaf)

/* ----- Sticky-head tuck progression — viewport-relative so it tracks "content arriving" rather than fixed pixels.
   START: body just touched the bottom of the viewport (tuck = 0, head fully open).
   END:   body has scrolled up to the vertical-middle of the viewport (tuck = 1, head locked at compact size).
   Past END, raw goes >1 but is clamped, so the head stops shrinking even as the user keeps scrolling. */
const sections = [...document.querySelectorAll('.A-section')]
  .map((section) => ({ section, body: section.querySelector('.A-section__body') }))
  .filter((s) => s.body)

let pending = false

function update() {
  pending = false
  const vh = window.innerHeight
  const START = vh
  const END = vh * 0.5
  for (const { section, body } of sections) {
    const top = body.getBoundingClientRect().top
    const raw = (START - top) / (START - END)
    const tuck = Math.max(0, Math.min(1, raw))
    section.style.setProperty('--tuck', tuck.toFixed(3))
    const head = section.querySelector('.A-section__head')
    if (head) head.classList.toggle('is-tucked', tuck > 0.7)
  }
}

/* Topbar stays transparent while the hero is in view; becomes glass once it's fully scrolled past */
const heroForTopbar = document.querySelector('.A-hero, .P-hero')
if (heroForTopbar) {
  new IntersectionObserver(
    ([entry]) => document.body.classList.toggle('is-scrolled', !entry.isIntersecting),
    { threshold: 0 }
  ).observe(heroForTopbar)
} else {
  const onScrollHeader = () => document.body.classList.toggle('is-scrolled', window.scrollY > 30)
  window.addEventListener('scroll', onScrollHeader, { passive: true })
  onScrollHeader()
}

function onScroll() {
  if (pending) return
  pending = true
  requestAnimationFrame(update)
}

window.addEventListener('scroll', onScroll, { passive: true })
window.addEventListener('resize', onScroll, { passive: true })
update()

/* ----- Selected Work carousel (auto only, seamless forward loop) ----- */
const workSection = document.querySelector('#work')
if (workSection) {
  const indexItems = [...workSection.querySelectorAll('.work-index__item')]
  const track = workSection.querySelector('.work-carousel__track')
  const total = indexItems.length
  const TRANSITION = 'transform 0.7s cubic-bezier(.7, 0, .2, 1)'
  const TRANSITION_MS = 720
  const AUTO_MS = 2800

  // Clone the first slide and append to the end of the track. This lets the
  // transition from last → first run forward (animating one more step into the
  // clone), then we snap back to the real first slide with no animation.
  if (track && track.firstElementChild) {
    const clone = track.firstElementChild.cloneNode(true)
    clone.setAttribute('aria-hidden', 'true')
    clone.setAttribute('tabindex', '-1')
    track.appendChild(clone)
  }

  let position = 0 // 0..total, where `total` is the clone of slide 0
  let timer = null

  const render = (animate = true) => {
    const activeIndex = position % total
    indexItems.forEach((el, i) => el.classList.toggle('is-active', i === activeIndex))
    if (track) {
      track.style.transition = animate ? TRANSITION : 'none'
      track.style.transform = `translateX(-${position * 100}%)`
    }
  }

  const advance = () => {
    position++
    render(true)
    if (position === total) {
      // Just animated onto the clone. After the transition lands, jump back to 0.
      setTimeout(() => {
        position = 0
        render(false)
      }, TRANSITION_MS)
    }
  }

  let isPreviewing = false
  let savedPosition = 0

  const start = () => {
    stop()
    if (isPreviewing) return // don't auto-advance during hover preview
    timer = setInterval(advance, AUTO_MS)
  }
  const stop = () => { if (timer) { clearInterval(timer); timer = null } }

  // Index entries and slides are real links to project pages — let the click navigate.
  // Pause auto-rotate while hovering the carousel so the slide doesn't change mid-click.
  const carousel = workSection.querySelector('.work-carousel')
  if (carousel) {
    carousel.addEventListener('mouseenter', stop)
    carousel.addEventListener('mouseleave', start)
  }

  // Hover-to-preview: hovering an index title temporarily drives the carousel; on leave it returns to where auto-advance was.
  const workIndex = workSection.querySelector('.work-index')
  if (workIndex) {
    workIndex.addEventListener('mouseenter', () => {
      if (!isPreviewing) {
        savedPosition = position % total
        isPreviewing = true
        stop()
      }
    })
    workIndex.addEventListener('mouseleave', () => {
      if (isPreviewing) {
        isPreviewing = false
        position = savedPosition
        render(true)
        start()
      }
    })
    indexItems.forEach((el, i) => {
      el.addEventListener('mouseenter', () => {
        if (isPreviewing && position !== i) {
          position = i
          render(true)
        }
      })
    })
  }

  new IntersectionObserver(([entry]) => entry.isIntersecting ? start() : stop(), { threshold: 0.2 }).observe(workSection)
  render(false)
}

/* ----- Trifecta reveal: footer tracks the trifecta's top edge as user scrolls into it.
   - target is computed from scroll position (where the footer should sit)
   - current is lerped toward target each frame so the motion has weight/resistance
   - --lift CSS var is driven from the current lift distance so the shadow grows with it ----- */
const trifectaSection = document.querySelector('#trifecta')
const trifectaFoot = document.querySelector('.A-foot')
if (trifectaSection && trifectaFoot) {
  let targetY = 0
  let currentY = 0

  const recomputeTarget = () => {
    const trifectaTop = trifectaSection.getBoundingClientRect().top
    const vh = window.innerHeight
    const fh = trifectaFoot.offsetHeight
    const defaultTop = vh - fh
    const targetTop = Math.max(0, Math.min(defaultTop, trifectaTop))
    targetY = targetTop - defaultTop // 0 at rest, negative when lifted
  }

  const renderFooter = () => {
    // ease toward target — 0.11 ≈ moderate resistance (lower = heavier feel)
    currentY += (targetY - currentY) * 0.11
    if (Math.abs(currentY - targetY) < 0.3) currentY = targetY
    trifectaFoot.style.transform = `translateY(${currentY}px)`
    // hairline grows progressively across the full pull range (rest → fully-lifted)
    const maxLift = Math.max(1, window.innerHeight - trifectaFoot.offsetHeight)
    const liftIntensity = Math.min(Math.abs(currentY) / maxLift, 1)
    trifectaFoot.style.setProperty('--lift', liftIntensity.toFixed(3))
    requestAnimationFrame(renderFooter)
  }

  window.addEventListener('scroll', recomputeTarget, { passive: true })
  window.addEventListener('resize', recomputeTarget, { passive: true })
  recomputeTarget()
  renderFooter()
}

/* ----- Neural-graph closer (trifecta) — ported 1:1 from synapserstudio.com.
   The minified production chunk (reference/chunks/9b880d591d4ff178.js) revealed
   it's GSAP-driven canvas + custom boids-style physics. All numeric constants
   below come straight from the original.

   Architecture:
     - <canvas> holds the connecting lines (drawn each frame)
     - Each surrounding word is an absolutely-positioned <div>, moved via transform
     - A central title element ("Design") sits at the geometric center

   State per word: { x, y, vx, vy, alpha, lineProgress, centerLineAlpha, flashUntil }
   Initial positions are RANDOM across the canvas (not fixed).

   Modes (currentTarget):
     - null            → idle drift
     - <wordId>        → that word is the focus; others pull toward it (or repel
                         if within 95px); word-word repulsion under 58px
     - "title"         → title is the focus; all words attract to center;
                         word-word repulsion under 75px

   Scheduler: every 5-6.5s a random word becomes the target; 1.5s later
   it's kicked free (random velocity + nearby words pushed outward).

   Velocity damping: vx *= 0.98 each frame when |vx| > 0.3, same for vy.

   Bounding boxes: words bounce off the central title's bbox + 20px breathing,
   and off the outer canvas walls + 20px. */
const graphEl = document.querySelector('.A-graph')
if (graphEl) {
  const canvas = graphEl.querySelector('.A-graph__canvas')
  const ctx = canvas.getContext('2d')
  const titleEl = graphEl.querySelector('.A-graph__title')
  const wordEls = [...graphEl.querySelectorAll('.A-graph__word')]

  const words = wordEls.map((el, i) => ({
    id: i, el, text: el.textContent,
    x: 0, y: 0, vx: 0, vy: 0,
    alpha: 0, lineProgress: 0,
    alphaDelay: Math.random() * 1500,
    centerLineAlpha: 1,
    flashUntil: 0,
  }))

  let currentTarget = null      // null | word id | "title"
  let titleInteracted = false   // set true when title is hovered; disables auto scheduler
  let pendingLeaveTimer = null
  const schedulerTimers = []

  // Cached layout — recomputed on resize and once after fonts load
  let titleBox = { width: 0, height: 0, yOffset: 0 }   // inflated bbox + breathing
  const wordBoxes = {}                                  // id → { width, height }
  let dpr = Math.min(window.devicePixelRatio || 1, 2)

  function measureLayout() {
    const r = graphEl.getBoundingClientRect()
    // Canvas backing-store at device resolution; CSS size matches the container
    canvas.width = Math.max(1, Math.round(r.width * dpr))
    canvas.height = Math.max(1, Math.round(r.height * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const tr = titleEl.getBoundingClientRect()
    const breathing = window.innerWidth < 640 ? 12 : 25
    titleBox = {
      width: tr.width + 2 * breathing,
      height: tr.height + 2 * breathing,
      yOffset: (tr.top + tr.height / 2) - (r.top + r.height / 2),
    }
    for (const w of words) {
      const wr = w.el.getBoundingClientRect()
      wordBoxes[w.id] = { width: wr.width, height: wr.height }
    }
  }

  function initPositions() {
    const r = graphEl.getBoundingClientRect()
    for (const w of words) {
      w.x = Math.random() * r.width
      w.y = Math.random() * r.height
      w.vx = (Math.random() - 0.5) * 0.5
      w.vy = (Math.random() - 0.5) * 0.5
      w.alpha = 0
      w.lineProgress = 0
      w.centerLineAlpha = 1
      w.flashUntil = 0
    }
  }

  // Intro fade-in — power3.inOut over 2s, stagger up to 1.5s
  let introStart = 0
  function tickIntro(now) {
    if (!introStart) return
    for (const w of words) {
      const elapsed = Math.max(0, now - introStart - w.alphaDelay)
      const t = Math.min(1, elapsed / 2000)
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      w.alpha = eased
      w.lineProgress = eased
    }
  }

  // Release a focused word: push neighbors outward + give the freed word a random velocity
  function releaseTarget() {
    const targetId = currentTarget
    currentTarget = null
    if (targetId === null || targetId === 'title') return
    const target = words.find((w) => w.id === targetId)
    if (!target) return
    for (const w of words) {
      const dx = w.x - target.x
      const dy = w.y - target.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      w.vx += (dx / dist) * 2.2
      w.vy += (dy / dist) * 2.2
    }
    const angle = Math.random() * Math.PI * 2
    const mag = 1.2 + 0.5 * Math.random()
    target.vx = Math.cos(angle) * mag
    target.vy = Math.sin(angle) * mag
  }

  // Hover handlers
  function hoverWord(id) {
    const w = words[id]
    if (!w || (w.alpha ?? 0) < 0.95) return
    if (pendingLeaveTimer) { clearTimeout(pendingLeaveTimer); pendingLeaveTimer = null }
    currentTarget = id
  }
  function leaveWord(id) {
    if (currentTarget !== id) return
    if (pendingLeaveTimer) clearTimeout(pendingLeaveTimer)
    pendingLeaveTimer = setTimeout(() => { releaseTarget(); pendingLeaveTimer = null }, 70)
  }
  function hoverTitle() {
    if (pendingLeaveTimer) { clearTimeout(pendingLeaveTimer); pendingLeaveTimer = null }
    currentTarget = 'title'
    titleInteracted = true
  }
  function leaveTitle() {
    if (currentTarget !== 'title') return
    if (pendingLeaveTimer) clearTimeout(pendingLeaveTimer)
    pendingLeaveTimer = setTimeout(() => {
      const r = graphEl.getBoundingClientRect()
      const cx = r.width / 2
      const cy = r.height / 2
      for (const w of words) {
        const dx = w.x - cx
        const dy = w.y - cy
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const a = (Math.random() - 0.5) * 1.5
        const s = Math.cos(a), o = Math.sin(a)
        w.vx += (dx / dist * s - dy / dist * o) * 7 * (0.8 + 0.8 * Math.random())
        w.vy += (dx / dist * o + dy / dist * s) * 7 * (0.8 + 0.8 * Math.random())
      }
      currentTarget = null
      pendingLeaveTimer = null
    }, 70)
  }

  // Wire up event listeners
  wordEls.forEach((el, i) => {
    el.addEventListener('mouseenter', () => hoverWord(i))
    el.addEventListener('mouseleave', () => leaveWord(i))
  })
  titleEl.addEventListener('mouseenter', hoverTitle)
  titleEl.addEventListener('mouseleave', leaveTitle)

  // Auto target scheduler — picks a random word every few seconds
  function scheduleNext(ms) {
    if (titleInteracted) return
    const t = setTimeout(pickRandomTarget, ms)
    schedulerTimers.push(t)
  }
  function pickRandomTarget() {
    if (titleInteracted) return
    if (currentTarget !== null) { scheduleNext(5000); return }
    const ready = words.filter((w) => (w.alpha ?? 0) >= 0.95)
    if (ready.length === 0) { scheduleNext(1500); return }
    const pick = ready[Math.floor(Math.random() * ready.length)]
    currentTarget = pick.id
    scheduleNext(6500)
    const releaseTimer = setTimeout(() => {
      if (currentTarget === pick.id && !titleInteracted) releaseTarget()
    }, 1500)
    schedulerTimers.push(releaseTimer)
  }

  // Main animation loop
  let running = false
  let rafId = 0
  function tick(now) {
    if (!running) { rafId = 0; return }
    const r = graphEl.getBoundingClientRect()
    const W = r.width, H = r.height
    if (W === 0 || H === 0) { rafId = requestAnimationFrame(tick); return }
    const cx = W / 2, cy = H / 2

    tickIntro(now)
    ctx.clearRect(0, 0, W, H)

    const target = currentTarget
    const hasWordTarget = target !== null && target !== 'title'
    const targetWord = hasWordTarget ? words.find((w) => w.id === target) : null

    for (const word of words) {
      const isTarget = target === word.id
      let { x: wx, y: wy, vx, vy } = word
      const wb = wordBoxes[word.id] || { width: 100, height: 30 }

      if (isTarget) {
        vx *= 0.55
        vy *= 0.55
      } else if (hasWordTarget && targetWord) {
        const dx = targetWord.x - wx
        const dy = targetWord.y - wy
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        if (dist < 380) {
          const ux = dx / dist, uy = dy / dist
          if (dist > 95) {
            const f = 0.022 * Math.min(1, (380 - dist) / 200)
            vx += ux * f; vy += uy * f
          } else {
            const f = 0.05 * (1 - dist / 95)
            vx -= ux * f; vy -= uy * f
          }
        }
        // Word-word repulsion under 58px
        for (const other of words) {
          if (other.id === word.id || other.id === target) continue
          const ox = wx - other.x, oy = wy - other.y
          const d2 = ox * ox + oy * oy
          if (d2 < 3364 && d2 > 1) {
            const d = Math.sqrt(d2)
            const f = 0.05 * (1 - d / 58)
            vx += (ox / d) * f; vy += (oy / d) * f
          }
        }
      } else if (target === 'title') {
        const dx = cx - wx, dy = cy - wy
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        vx += (dx / dist) * 0.04
        vy += (dy / dist) * 0.04
        for (const other of words) {
          if (other.id === word.id) continue
          const ox = wx - other.x, oy = wy - other.y
          const d2 = ox * ox + oy * oy
          if (d2 < 5625 && d2 > 1) {
            const d = Math.sqrt(d2)
            const f = 0.08 * (1 - d / 75)
            vx += (ox / d) * f; vy += (oy / d) * f
          }
        }
      }

      if (Math.abs(vx) > 0.3) vx *= 0.98
      if (Math.abs(vy) > 0.3) vy *= 0.98

      wx += vx
      wy += vy

      // Title bbox collision (push out, invert velocity, flash)
      if (titleBox.width > 0 && titleBox.height > 0) {
        const xRange = titleBox.width / 2 + wb.width / 2
        const yRange = titleBox.height / 2 + wb.height / 2
        const tdx = wx - cx
        const tdy = wy - (cy + titleBox.yOffset)
        if (Math.abs(tdx) < xRange && Math.abs(tdy) < yRange) {
          const xOver = xRange - Math.abs(tdx)
          const yOver = yRange - Math.abs(tdy)
          if (xOver < yOver) {
            if (tdx > 0) { wx += xOver; vx = Math.abs(vx) }
            else { wx -= xOver; vx = -Math.abs(vx) }
          } else {
            if (tdy > 0) { wy += yOver; vy = Math.abs(vy) }
            else { wy -= yOver; vy = -Math.abs(vy) }
          }
          if (now > (word.flashUntil || 0) + 120) word.flashUntil = now + 240
        }
      }

      // Outer wall collision
      const halfW = wb.width / 2
      const minX = halfW + 20, maxX = W - halfW - 20
      if (minX <= maxX) {
        if (wx <= minX) { wx = minX; vx = Math.max(Math.abs(vx), 0.2) }
        else if (wx >= maxX) { wx = maxX; vx = -Math.max(Math.abs(vx), 0.2) }
      } else { wx = W / 2; vx = 0 }
      const halfH = wb.height / 2
      const minY = halfH + 20, maxY = H - halfH - 20
      if (minY <= maxY) {
        if (wy <= minY) { wy = minY; vy = Math.max(Math.abs(vy), 0.2) }
        else if (wy >= maxY) { wy = maxY; vy = -Math.max(Math.abs(vy), 0.2) }
      } else { wy = H / 2; vy = 0 }

      // Write back
      word.x = wx; word.y = wy; word.vx = vx; word.vy = vy

      // Render the div (with subtle flash jitter when active)
      let dispX = wx, dispY = wy
      if (isTarget) {
        dispX += (Math.random() - 0.5) * 1.6
        dispY += (Math.random() - 0.5) * 1.6
      }
      word.el.style.transform = `translate3d(${dispX}px, ${dispY}px, 0) translate(-50%, -50%)`
      word.el.style.opacity = word.alpha

      // Line endpoints — clip to title bbox at near end, to word's bbox at far end
      let M = cx, N = cy, k = wx, S = wy
      if (titleBox.width > 0) {
        const e = k - cx
        const t = S - cy
        const r2 = titleBox.height / 2
        const i = titleBox.yOffset
        const a = Math.min(
          titleBox.width / 2 / Math.abs(e || 1),
          t === 0 ? Infinity : (i + Math.sign(t) * r2) / t
        )
        if (a < 1) { M = cx + e * a; N = cy + t * a }
      }
      const dxe = M - k
      const dye = N - S
      const wordClip = Math.min(
        wb.width / 2 / Math.abs(dxe || 1),
        wb.height / 2 / Math.abs(dye || 1)
      )
      if (wordClip < 1) { k += dxe * wordClip; S += dye * wordClip }

      const T = (k - M) ** 2 + (S - N) ** 2
      const C = word.lineProgress ?? word.alpha

      // Line opacity hides as a word approaches the current word-target
      let E = 1
      if (hasWordTarget && !isTarget && targetWord) {
        const ddx = wx - targetWord.x
        const ddy = wy - targetWord.y
        const dT = Math.sqrt(ddx * ddx + ddy * ddy)
        if (dT <= 320) E = 0
        else if (dT < 380) E = (dT - 320) / 60
      }
      word.centerLineAlpha += (E - word.centerLineAlpha) * 0.06
      const R = word.centerLineAlpha

      if (T > 100 && C > 0.01 && R > 0.02) {
        const flashRem = Math.max(0, (word.flashUntil || 0) - now)
        const flash = flashRem > 0 ? Math.pow(flashRem / 240, 2) : 0
        if (flash > 0) {
          ctx.strokeStyle = `rgba(4, 8, 61, ${(0.7 + 0.3 * flash) * R})`
          ctx.lineWidth = 0.5 + 0.7 * flash
        } else {
          ctx.strokeStyle = `rgba(83, 83, 82, ${R})`
          ctx.lineWidth = 0.5
        }
        ctx.beginPath()
        ctx.moveTo(M, N)
        ctx.lineTo(M + (k - M) * C, N + (S - N) * C)
        ctx.stroke()
      }
    }

    // Word-to-target lines (extra lines from each word to the focal word)
    if (hasWordTarget && targetWord) {
      const tBox = wordBoxes[targetWord.id] || { width: 80, height: 30 }
      for (const other of words) {
        if (other.id === targetWord.id) continue
        const a = Math.min(1, other.alpha ?? 1)
        if (a < 0.02) continue
        const dx = other.x - targetWord.x
        const dy = other.y - targetWord.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        if (dist >= 380) continue
        const fade = (dist > 320 ? (380 - dist) / 60 : 1) * a * Math.min(1, targetWord.alpha ?? 1) * 0.6
        if (fade < 0.02) continue
        const tc = Math.min(
          tBox.width / 2 / Math.abs(dx || 1),
          tBox.height / 2 / Math.abs(dy || 1),
          1
        )
        const x1 = targetWord.x + dx * tc
        const y1 = targetWord.y + dy * tc
        const oBox = wordBoxes[other.id] || { width: 80, height: 30 }
        const xc = Math.min(
          oBox.width / 2 / Math.abs(dx || 1),
          oBox.height / 2 / Math.abs(dy || 1),
          1
        )
        const x2 = other.x - dx * xc
        const y2 = other.y - dy * xc
        ctx.strokeStyle = `rgba(83, 83, 82, ${fade})`
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
    }

    rafId = requestAnimationFrame(tick)
  }

  function start() {
    if (running) return
    running = true
    if (!introStart) {
      measureLayout()
      initPositions()
      introStart = performance.now()
      scheduleNext(3000)
    }
    rafId = requestAnimationFrame(tick)
  }
  function stop() {
    running = false
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
  }

  // Run while the graph is in view; pause off-screen
  new IntersectionObserver(
    ([entry]) => { entry.isIntersecting ? start() : stop() },
    { threshold: 0 }
  ).observe(graphEl)

  // Re-measure on resize and after fonts settle
  window.addEventListener('resize', measureLayout)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measureLayout)
  }
}

/* ----- Creative Coding hover preview — spring-physics cursor follow.
   Matches the og Framer site: preview floats ~225px to the right of the
   cursor, vertically centered on the row, and trails the cursor through
   a spring simulation (Framer Motion uses the same model). CSS owns the
   opacity fade only; transform is JS-driven so it doesn't fight a CSS
   transition. */
const ccRows = [...document.querySelectorAll('.cc-row')]
const CC_OFFSET = 225          // matches og Framer offset captured in inspector
const SPRING_STIFFNESS = 320
const SPRING_DAMPING = 30
const SPRING_MASS = 1
ccRows.forEach((row) => {
  const preview = row.querySelector('.cc-row__preview')
  if (!preview) return
  let targetX = 0
  let currentX = 0
  let velocity = 0
  let rafId = 0
  let inside = false
  let lastTs = 0

  function step(ts) {
    rafId = 0
    if (!lastTs) lastTs = ts
    let dt = (ts - lastTs) / 1000
    lastTs = ts
    if (dt > 0.05) dt = 0.05 // clamp huge frame gaps (tab switch, etc.)

    // Spring: F = -k(x - x_target) - c*v, a = F / m
    const spring = -SPRING_STIFFNESS * (currentX - targetX)
    const damper = -SPRING_DAMPING * velocity
    const accel = (spring + damper) / SPRING_MASS
    velocity += accel * dt
    currentX += velocity * dt

    preview.style.transform = `translate3d(${currentX}px, -50%, 0)`

    const settled = Math.abs(currentX - targetX) < 0.1 && Math.abs(velocity) < 0.1
    if (inside && !settled) rafId = requestAnimationFrame(step)
    else if (settled) {
      currentX = targetX
      velocity = 0
      preview.style.transform = `translate3d(${currentX}px, -50%, 0)`
    }
  }

  row.addEventListener('mouseenter', (e) => {
    const r = row.getBoundingClientRect()
    targetX = e.clientX - r.left + CC_OFFSET
    currentX = targetX
    velocity = 0
    inside = true
    preview.style.transform = `translate3d(${currentX}px, -50%, 0)`
  })
  row.addEventListener('mousemove', (e) => {
    if (!inside) return
    const r = row.getBoundingClientRect()
    targetX = e.clientX - r.left + CC_OFFSET
    if (!rafId) {
      lastTs = 0
      rafId = requestAnimationFrame(step)
    }
  })
  row.addEventListener('mouseleave', () => {
    inside = false
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0 }
    velocity = 0
  })
})

/* ----- Play thumbnail selector ----- */
const playSection = document.querySelector('#play')
if (playSection) {
  const slides = [...playSection.querySelectorAll('.play-main__slide')]
  const thumbs = [...playSection.querySelectorAll('.play-thumb')]
  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', () => {
      slides.forEach((s, idx) => s.classList.toggle('is-active', idx === i))
      thumbs.forEach((t, idx) => t.classList.toggle('is-active', idx === i))
    })
  })
}

/* ----- Testimonials carousel ----- */
const tCard = document.querySelector('.A-testimonials__card')
if (tCard) {
  const tSlides = [...tCard.querySelectorAll('.A-testimonials__slide')]
  const tName = tCard.querySelector('.A-testimonials__name')
  const tCount = tCard.querySelector('.A-testimonials__count')
  const tArrows = [...tCard.querySelectorAll('.A-testimonials__arrow')]
  let ti = 0
  const tPad = (n) => String(n).padStart(3, '0')
  const tRender = () => {
    tSlides.forEach((s, idx) => s.classList.toggle('is-active', idx === ti))
    if (tName) tName.textContent = tSlides[ti].dataset.name
    if (tCount) tCount.textContent = tPad(ti + 1) + ' / ' + tPad(tSlides.length)
  }
  tArrows.forEach((btn) => btn.addEventListener('click', () => {
    const dir = Number(btn.dataset.dir)
    ti = (ti + dir + tSlides.length) % tSlides.length
    tRender()
  }))
  tRender()
}

/* ----- Album-grid cell cycling on /about/
   Ports the GridCell "images" mode from the OG Framer component exactly.
   - INTERVAL = 2500ms, DURATION = 420ms (OG defaults, no jitter)
   - Single <img> per cell, not crossfade: fade out → swap src → fade in
     (the OG uses one img and toggles opacity 1→0, then changes src and
     toggles 0→1, which produces a deliberate sequential fade)
   - Each cell has its OWN pool keyed by data-mode (photos / albums)
   - Starting image is randomized per cell so the two cells aren't on
     the same image; their timers start when constructed (close together
     but not in lockstep), so they fade at the same RATE but independently.
   - Pauses when scrolled off-screen */
const POOLS = {
  photos: [
    '/photos/photo-1.webp',
    '/photos/photo-2.webp',
    '/photos/photo-3.webp',
    '/photos/photo-4.webp',
    '/photos/photo-5.webp',
  ],
  albums: [
    '/albums/album-1.webp',
    '/albums/album-2.webp',
    '/albums/album-3.webp',
    '/albums/album-4.webp',
    '/albums/album-5.webp',
    '/albums/album-6.webp',
    '/albums/album-7.webp',
    '/albums/album-8.webp',
    '/albums/album-9.webp',
  ],
}
const cyclingCells = document.querySelectorAll('.album[data-mode="photos"], .album[data-mode="albums"]')
if (cyclingCells.length) {
  const INTERVAL = 2500   // OG default (verified from Framer inspector)
  const DURATION = 420    // OG default fade duration

  cyclingCells.forEach((cell) => {
    const pool = POOLS[cell.dataset.mode]
    if (!pool || pool.length === 0) return

    const img = document.createElement('img')
    img.className = 'album__img'
    img.draggable = false
    img.alt = ''
    cell.appendChild(img)

    let idx = Math.floor(Math.random() * pool.length)
    img.src = pool[idx]
    img.style.opacity = '1'

    let intervalId = null
    let swapTimeout = null

    function cycle() {
      // Phase 1: fade current image out
      img.style.opacity = '0'
      // Phase 2 (after fade completes): swap src and fade new image in
      swapTimeout = setTimeout(() => {
        idx = (idx + 1) % pool.length
        img.src = pool[idx]
        img.style.opacity = '1'
        swapTimeout = null
      }, DURATION)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !intervalId) {
          intervalId = setInterval(cycle, INTERVAL)
        } else if (!entry.isIntersecting && intervalId) {
          clearInterval(intervalId)
          if (swapTimeout) { clearTimeout(swapTimeout); swapTimeout = null }
          intervalId = null
          // Make sure the image stays visible if we paused mid-fade
          img.style.opacity = '1'
        }
      },
      { threshold: 0 }
    )
    io.observe(cell)
  })
}
