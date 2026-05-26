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

/* ----- Neural-graph closer (trifecta) — interactive constellation.
   Per-node magnetic pull toward cursor + slow sine drift; SVG lines re-drawn
   every frame from current node positions so they stretch and contract live.
   - Each node has a static rest position (--x / --y as % of graph) and a
     per-frame offset (--ox / --oy in px) folded into its transform
   - On rAF: target offset = sine drift (~3px) + cursor pull (up to ~28px when
     close). current eases toward target via lerp(0.14)
   - Lines connect each non-center node's current position to the center's
     current position; both ends shorten so the stroke doesn't slice text
   - Hovering a node tags its line .is-hot for emphasis
   - rAF only runs while the graph is intersecting the viewport */
const graphEl = document.querySelector('.A-graph')
if (graphEl) {
  const svg = graphEl.querySelector('.A-graph__lines')
  const allNodes = [...graphEl.querySelectorAll('.A-graph__node')]
  const centerNode = graphEl.querySelector('.A-graph__node--center')
  const nodes = allNodes.filter((n) => n !== centerNode)
  const SVG_NS = 'http://www.w3.org/2000/svg'

  // Build per-node state. Rest positions recomputed from the element's --x/--y
  // each tick so a resize naturally retunes the layout.
  function makeState(node, i) {
    return {
      node,
      i,
      // rest position in graph-local px (filled by tick)
      rx: 0, ry: 0,
      // current offset from rest, in px (eased)
      ox: 0, oy: 0,
      // independent sine-drift phase
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      speedX: 0.0006 + Math.random() * 0.0004,
      speedY: 0.0005 + Math.random() * 0.0004,
      ampX: 4 + Math.random() * 3,
      ampY: 3 + Math.random() * 3,
      // SVG line element (created lazily)
      line: null,
    }
  }
  const states = nodes.map(makeState)
  const centerState = { node: centerNode, rx: 0, ry: 0, ox: 0, oy: 0,
    phaseX: 0, phaseY: 0, speedX: 0, speedY: 0, ampX: 0, ampY: 0 }

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

  // Magnetic pull config — tuned for an inviting-not-aggressive feel
  const INFLUENCE_R = 220   // px — within this radius, cursor pulls a node
  const MAX_PULL = 28       // px — pull amount when cursor is right on top
  const LERP = 0.14         // ease factor — higher = snappier

  function targetOffset(s, now, mx, my, vx, vy) {
    // Cursor pull: shorter distance = stronger pull, toward cursor
    const ax = vx + s.rx          // node's rest position in viewport coords
    const ay = vy + s.ry
    const dx = mx - ax
    const dy = my - ay
    const dist = Math.hypot(dx, dy)
    let tx = 0, ty = 0
    if (dist < INFLUENCE_R && dist > 0) {
      const k = 1 - dist / INFLUENCE_R
      const pull = k * k * MAX_PULL
      tx += (dx / dist) * pull
      ty += (dy / dist) * pull
    }
    // Slow sine drift on top
    tx += Math.sin(s.phaseX + now * s.speedX) * s.ampX
    ty += Math.cos(s.phaseY + now * s.speedY) * s.ampY
    return { tx, ty }
  }

  let running = false
  let rafId = 0
  function tick(now) {
    if (!running) { rafId = 0; return }
    const r = graphEl.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) { rafId = requestAnimationFrame(tick); return }
    svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`)

    // Center node
    centerState.rx = pct(centerNode, '--x') * r.width
    centerState.ry = pct(centerNode, '--y') * r.height
    const { tx: ctx, ty: cty } = targetOffset(centerState, now, mouseX, mouseY, r.left, r.top)
    // Center has much weaker pull so it stays as the anchor — quarter strength
    const ctxd = ctx * 0.25, ctyd = cty * 0.25
    centerState.ox += (ctxd - centerState.ox) * LERP
    centerState.oy += (ctyd - centerState.oy) * LERP
    centerNode.style.setProperty('--ox', `${centerState.ox.toFixed(2)}px`)
    centerNode.style.setProperty('--oy', `${centerState.oy.toFixed(2)}px`)

    const cxNow = centerState.rx + centerState.ox
    const cyNow = centerState.ry + centerState.oy

    // Surrounding nodes
    for (const s of states) {
      s.rx = pct(s.node, '--x') * r.width
      s.ry = pct(s.node, '--y') * r.height
      const { tx, ty } = targetOffset(s, now, mouseX, mouseY, r.left, r.top)
      s.ox += (tx - s.ox) * LERP
      s.oy += (ty - s.oy) * LERP
      s.node.style.setProperty('--ox', `${s.ox.toFixed(2)}px`)
      s.node.style.setProperty('--oy', `${s.oy.toFixed(2)}px`)

      // Redraw the line for this node from current positions
      const nx = s.rx + s.ox
      const ny = s.ry + s.oy
      const len = Math.hypot(nx - cxNow, ny - cyNow)
      const padNear = Math.min(70, len * 0.22)
      const padFar = Math.min(24, len * 0.10)
      const t1 = padNear / len
      const t2 = (len - padFar) / len
      const x1 = cxNow + (nx - cxNow) * t1
      const y1 = cyNow + (ny - cyNow) * t1
      const x2 = cxNow + (nx - cxNow) * t2
      const y2 = cyNow + (ny - cyNow) * t2
      s.line.setAttribute('x1', x1.toFixed(2))
      s.line.setAttribute('y1', y1.toFixed(2))
      s.line.setAttribute('x2', x2.toFixed(2))
      s.line.setAttribute('y2', y2.toFixed(2))
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
