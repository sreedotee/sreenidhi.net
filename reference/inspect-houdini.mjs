import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://www.josehoudini.es/', { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5000))

// Look for any element with backdrop-filter, mask-image, or filter blur
const blurred = await page.evaluate(() => {
  const out = []
  const all = [...document.querySelectorAll('body *')]
  for (const el of all) {
    const cs = getComputedStyle(el)
    const hasBlur = (cs.backdropFilter && cs.backdropFilter !== 'none') ||
                    (cs.webkitBackdropFilter && cs.webkitBackdropFilter !== 'none') ||
                    (cs.filter && cs.filter !== 'none') ||
                    (cs.maskImage && cs.maskImage !== 'none') ||
                    (cs.webkitMaskImage && cs.webkitMaskImage !== 'none')
    if (!hasBlur) continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    out.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className?.toString?.() || '').slice(0, 100),
      position: cs.position,
      bottom: cs.bottom,
      top: cs.top,
      x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height),
      backdropFilter: cs.backdropFilter,
      filter: cs.filter,
      maskImage: cs.maskImage?.slice(0, 200),
      background: cs.background?.slice(0, 100),
      zIndex: cs.zIndex,
    })
  }
  return out.slice(0, 20)
})

// Look at the footer and what's near it including SVGs
const footerArea = await page.evaluate(() => {
  // Scroll to bottom
  window.scrollTo(0, document.body.scrollHeight)
  const all = [...document.querySelectorAll('body *')]
  const vh = window.innerHeight
  // Elements that overlap with the bottom 100px
  const bottomEls = []
  for (const el of all) {
    const r = el.getBoundingClientRect()
    if (r.bottom < vh - 100 || r.top > vh) continue
    if (r.width === 0 || r.height === 0) continue
    bottomEls.push(el)
  }
  return bottomEls.slice(0, 40).map((el) => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return {
      tag: el.tagName.toLowerCase(),
      cls: (el.className?.toString?.() || '').slice(0, 80),
      position: cs.position,
      bg: cs.backgroundColor,
      bgImg: cs.backgroundImage?.slice(0, 80),
      backdropFilter: cs.backdropFilter,
      maskImage: cs.maskImage?.slice(0, 120),
      x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height),
      innerHTML: el.children.length === 0 ? (el.innerHTML.slice(0, 80)) : `[${el.children.length} children]`,
    }
  })
})

// Find any SVG icons in the footer area
const svgIcons = await page.evaluate(() => {
  const all = [...document.querySelectorAll('svg')]
  const vh = window.innerHeight
  return all
    .filter((svg) => {
      const r = svg.getBoundingClientRect()
      return r.bottom >= vh - 200 && r.top <= vh
    })
    .slice(0, 10)
    .map((svg) => ({
      cls: (svg.getAttribute('class') || '').slice(0, 60),
      viewBox: svg.getAttribute('viewBox'),
      ariaLabel: svg.getAttribute('aria-label') || svg.parentElement?.getAttribute('aria-label') || '',
      parentTag: svg.parentElement?.tagName.toLowerCase(),
      parentHref: svg.parentElement?.getAttribute?.('href'),
      innerHTML: svg.outerHTML.slice(0, 400),
    }))
})

console.log('=== BLURRED / MASKED ELEMENTS ===')
console.log(JSON.stringify(blurred, null, 2))
console.log('\n=== FOOTER AREA (bottom 100px) ===')
console.log(JSON.stringify(footerArea, null, 2))
console.log('\n=== SVG ICONS NEAR FOOTER ===')
console.log(JSON.stringify(svgIcons, null, 2))

await browser.close()
