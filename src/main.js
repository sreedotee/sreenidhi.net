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

/* ----- Neural-graph closer (trifecta) — draw SVG lines from each node to the center,
   trigger the draw-in stroke animation when the graph scrolls into view, recompute on resize. */
const graphEl = document.querySelector('.A-graph')
if (graphEl) {
  const svg = graphEl.querySelector('.A-graph__lines')
  const center = graphEl.querySelector('.A-graph__node--center')
  const nodes = [...graphEl.querySelectorAll('.A-graph__node:not(.A-graph__node--center)')]
  const SVG_NS = 'http://www.w3.org/2000/svg'

  function drawLines() {
    const r = graphEl.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return
    svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`)
    // Wipe and redraw — cheap; only fires on layout / resize / scroll-in
    while (svg.firstChild) svg.removeChild(svg.firstChild)
    const cRect = center.getBoundingClientRect()
    const cx = cRect.left + cRect.width / 2 - r.left
    const cy = cRect.top + cRect.height / 2 - r.top
    const isVisible = graphEl.classList.contains('is-visible')
    for (const node of nodes) {
      const n = node.getBoundingClientRect()
      const nx = n.left + n.width / 2 - r.left
      const ny = n.top + n.height / 2 - r.top
      const len = Math.hypot(nx - cx, ny - cy)
      const line = document.createElementNS(SVG_NS, 'line')
      line.setAttribute('x1', cx)
      line.setAttribute('y1', cy)
      line.setAttribute('x2', nx)
      line.setAttribute('y2', ny)
      // Stop the line short of the word so the stroke doesn't slice through the text
      const padding = Math.min(48, len * 0.18)
      const t = (len - padding) / len
      line.setAttribute('x2', cx + (nx - cx) * t)
      line.setAttribute('y2', cy + (ny - cy) * t)
      line.style.strokeDasharray = len
      line.style.strokeDashoffset = isVisible ? '0' : len
      svg.appendChild(line)
    }
  }
  drawLines()
  window.addEventListener('resize', drawLines)

  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        graphEl.classList.add('is-visible')
        // Trigger the transition by setting dashoffset to 0
        svg.querySelectorAll('line').forEach((line) => {
          line.style.strokeDashoffset = '0'
        })
      }
    },
    { threshold: 0.25 }
  ).observe(graphEl)
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
