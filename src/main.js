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

/* ----- Neural-graph closer (trifecta) — interactive constellation v2.
   Based on frame-by-frame analysis of synapserstudio.com — see
   reference/synapser-drift-onPrecision.json. Key observed behaviors:
     - words drift continuously in straight-ish lines at ~50 px/sec (slow orbit)
     - cursor entering the area triggers spring-like motion with significant
       overshoot (damping ratio ~0.4-0.5)
     - far-away words still move noticeably when cursor enters
     - settling takes >1 second
   Implementation matches the character (not the exact pixel paths):
     - Each non-center node has rest (--x/--y), target offset, current offset,
       velocity. Verlet-ish spring (stiffness=90, damping=9 → ratio ~0.47).
     - Target = slow sine drift (±40px) + cursor pull (unit vector toward
       cursor, magnitude min(120, dist * 0.5) — capped, no hard radius).
     - Lines recompute every frame from current positions; both ends shortened
       so the stroke doesn't slice into the text.
     - rAF runs only while graph intersects viewport. */
const graphEl = document.querySelector('.A-graph')
if (graphEl) {
  const svg = graphEl.querySelector('.A-graph__lines')
  const allNodes = [...graphEl.querySelectorAll('.A-graph__node')]
  const centerNode = graphEl.querySelector('.A-graph__node--center')
  const nodes = allNodes.filter((n) => n !== centerNode)
  const SVG_NS = 'http://www.w3.org/2000/svg'

  // Per-node state. ox/oy is the current offset from rest in px; vx/vy is velocity.
  function makeState(node, i) {
    return {
      node, i,
      rx: 0, ry: 0,           // rest position in graph-local px (filled by tick)
      ox: 0, oy: 0,           // current offset from rest
      vx: 0, vy: 0,           // velocity
      phaseX: Math.random() * Math.PI * 2,  // drift phase (independent per node)
      phaseY: Math.random() * Math.PI * 2,
      driftSpeed: 0.00018 + Math.random() * 0.00008,  // ~30-40 sec period
      ampX: 32 + Math.random() * 14,   // drift amplitude (much bigger than v1)
      ampY: 28 + Math.random() * 14,
      line: null,
    }
  }
  const states = nodes.map(makeState)
  // Center gets a smaller, slower drift; very gentle cursor pull so it stays the anchor
  const centerState = {
    node: centerNode, rx: 0, ry: 0, ox: 0, oy: 0, vx: 0, vy: 0,
    phaseX: 0, phaseY: 0, driftSpeed: 0.00012, ampX: 8, ampY: 6,
  }

  function pct(node, key) {
    const raw = node.style.getPropertyValue(key).trim()
    return raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw)
  }

  // Build the SVG lines once (one per non-center node, tagged by index)
  function buildLines() {
    while (svg.firstChild) svg.removeChild(svg.firstChild)
    states.forEach((s) => {
      const line = document.createElementNS(SVG_NS, 'line')
      line.dataset.i = s.i
      svg.appendChild(line)
      s.line = line
    })
  }
  buildLines()

  // Pointer tracking — pageless coords, since mousemove also fires on inner children
  let mouseX = -99999, mouseY = -99999
  graphEl.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY })
  graphEl.addEventListener('mouseleave', () => { mouseX = mouseY = -99999 })

  // Spring config — underdamped for visible overshoot (matches synapser feel)
  const STIFFNESS = 90        // per second² — restoring force per px of offset
  const DAMPING = 9           // per second — velocity decay (ratio = 9/(2√90) ≈ 0.47)
  const PULL_FACTOR = 0.5     // 50% of cursor distance contributes to target
  const PULL_CAP = 120        // px — max pull (no hard radius; far cursors still pull)
  const CENTER_PULL_SCALE = 0.18  // center moves much less than surrounding nodes

  function computeTarget(s, now, mx, my, isCenter) {
    // Slow sine drift baseline — gives words a perpetual life
    let tx = Math.sin(s.phaseX + now * s.driftSpeed) * s.ampX
    let ty = Math.cos(s.phaseY + now * s.driftSpeed * 0.83) * s.ampY
    // Cursor pull — unit vector toward cursor, magnitude capped
    if (mx !== -99999) {
      const dx = mx - s.rx
      const dy = my - s.ry
      const dist = Math.hypot(dx, dy)
      if (dist > 0.5) {
        const mag = Math.min(PULL_CAP, dist * PULL_FACTOR) * (isCenter ? CENTER_PULL_SCALE : 1)
        tx += (dx / dist) * mag
        ty += (dy / dist) * mag
      }
    }
    return { tx, ty }
  }

  // Verlet-style integration step
  function integrate(s, tx, ty, dt) {
    const ax = (tx - s.ox) * STIFFNESS - s.vx * DAMPING
    const ay = (ty - s.oy) * STIFFNESS - s.vy * DAMPING
    s.vx += ax * dt
    s.vy += ay * dt
    s.ox += s.vx * dt
    s.oy += s.vy * dt
  }

  let running = false
  let rafId = 0
  let lastT = 0
  function tick(now) {
    if (!running) { rafId = 0; return }
    const r = graphEl.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) { rafId = requestAnimationFrame(tick); return }
    svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`)

    // Real dt (clamped so a tab-switch pause doesn't explode the spring)
    const dt = Math.min(1 / 30, lastT ? (now - lastT) / 1000 : 1 / 60)
    lastT = now

    // Cursor coordinates in graph-local space (graph rect)
    const mxLocal = mouseX === -99999 ? -99999 : mouseX - r.left
    const myLocal = mouseY === -99999 ? -99999 : mouseY - r.top

    // Center node — slow drift, gentle pull
    centerState.rx = pct(centerNode, '--x') * r.width
    centerState.ry = pct(centerNode, '--y') * r.height
    const { tx: ctx, ty: cty } = computeTarget(centerState, now, mxLocal, myLocal, true)
    integrate(centerState, ctx, cty, dt)
    centerNode.style.setProperty('--ox', centerState.ox.toFixed(2) + 'px')
    centerNode.style.setProperty('--oy', centerState.oy.toFixed(2) + 'px')
    const cxNow = centerState.rx + centerState.ox
    const cyNow = centerState.ry + centerState.oy

    // Measure the "Design" word once per frame so the lines clear its bounding box.
    // We approximate the word as an ellipse with semi-axes (halfW + breathing, halfH + breathing)
    // and intersect each line with that ellipse to find a clean starting point.
    const cRect = centerNode.getBoundingClientRect()
    const cHalfW = cRect.width / 2 + 18    // breathing room: 18px on the long side
    const cHalfH = cRect.height / 2 + 10   // 10px on the short side

    // Surrounding nodes
    for (const s of states) {
      s.rx = pct(s.node, '--x') * r.width
      s.ry = pct(s.node, '--y') * r.height
      const { tx, ty } = computeTarget(s, now, mxLocal, myLocal, false)
      integrate(s, tx, ty, dt)
      s.node.style.setProperty('--ox', s.ox.toFixed(2) + 'px')
      s.node.style.setProperty('--oy', s.oy.toFixed(2) + 'px')

      // Line endpoints from current node + center positions
      const nx = s.rx + s.ox
      const ny = s.ry + s.oy
      const dx = nx - cxNow
      const dy = ny - cyNow
      const len = Math.hypot(dx, dy)
      if (len > 1) {
        const ux = dx / len
        const uy = dy / len
        // Distance from center along the line at which we exit the "Design" ellipse
        const tNear = 1 / Math.sqrt((ux / cHalfW) ** 2 + (uy / cHalfH) ** 2)
        // Don't draw if the node is inside the ellipse (would create reversed lines)
        if (len > tNear + 8) {
          const padFar = Math.min(24, len * 0.10)
          const tFar = len - padFar
          s.line.setAttribute('x1', (cxNow + ux * tNear).toFixed(2))
          s.line.setAttribute('y1', (cyNow + uy * tNear).toFixed(2))
          s.line.setAttribute('x2', (cxNow + ux * tFar).toFixed(2))
          s.line.setAttribute('y2', (cyNow + uy * tFar).toFixed(2))
          s.line.style.opacity = ''
        } else {
          // Hide lines whose endpoint is too close to or inside the center word
          s.line.style.opacity = '0'
        }
      }
    }

    rafId = requestAnimationFrame(tick)
  }

  function start() {
    if (running) return
    running = true
    graphEl.classList.add('is-visible')
    rafId = requestAnimationFrame(tick)
  }
  function stop() {
    running = false
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
  }

  // Watch visibility — kick the rAF loop on, pause when off-screen
  new IntersectionObserver(
    ([entry]) => { entry.isIntersecting ? start() : stop() },
    { threshold: 0 }
  ).observe(graphEl)

  // Hovering a word lights up its line
  states.forEach((s) => {
    s.node.addEventListener('mouseenter', () => s.line.classList.add('is-hot'))
    s.node.addEventListener('mouseleave', () => s.line.classList.remove('is-hot'))
  })

  window.addEventListener('resize', () => {
    // Resize is handled implicitly by next tick reading getBoundingClientRect again,
    // but make sure rAF is queued in case we're paused.
    if (running && !rafId) rafId = requestAnimationFrame(tick)
  })
}

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
