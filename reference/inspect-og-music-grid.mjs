import puppeteer from 'puppeteer'
import fs from 'fs'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://sreedotee.framer.website/about', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 4000))

// Find "i love music" text and walk up to find the grid container
const grid = await page.evaluate(() => {
  function findText(text) {
    for (const el of document.querySelectorAll('*')) {
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('').toLowerCase()
      if (own === text.toLowerCase()) return el
    }
    return null
  }
  function scrollIntoView(el) {
    if (!el) return
    el.scrollIntoView({ block: 'center' })
  }
  const labelEl = findText('i love music') || findText('I love music')
  if (!labelEl) return { found: false }
  scrollIntoView(labelEl)
  return { found: true, labelRect: labelEl.getBoundingClientRect().toJSON() }
})
console.log('Label found:', grid.found)
await new Promise((r) => setTimeout(r, 1500))
await page.evaluate(() => window.scrollBy(0, -100))
await new Promise((r) => setTimeout(r, 1500))

await page.screenshot({ path: 'reference/og-music-section.png', fullPage: false })

// Inspect all images near "i love music"
const imgInfo = await page.evaluate(() => {
  const labelEl = (() => {
    for (const el of document.querySelectorAll('*')) {
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('').toLowerCase()
      if (own === 'i love music') return el
    }
    return null
  })()
  if (!labelEl) return null
  // Find common ancestor that contains both the label and the grid
  let container = labelEl
  for (let i = 0; i < 10; i++) {
    container = container.parentElement || container
    if (container.querySelectorAll('img').length > 0) break
  }
  const rect = container.getBoundingClientRect()
  return {
    containerInfo: {
      tag: container.tagName,
      cls: typeof container.className === 'string' ? container.className.slice(0, 200) : '',
      x: Math.round(rect.left), y: Math.round(rect.top), w: Math.round(rect.width), h: Math.round(rect.height),
    },
    images: [...container.querySelectorAll('img')].map((img) => {
      const r = img.getBoundingClientRect()
      return {
        src: img.src,
        alt: img.alt,
        x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
      }
    }),
    // Look for the actual grid wrapper
    girdCandidates: [...container.querySelectorAll('*')].filter((el) => {
      const cs = getComputedStyle(el)
      return cs.display === 'grid' || cs.display === 'flex'
    }).slice(0, 8).map((el) => {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return {
        tag: el.tagName,
        cls: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
        display: cs.display,
        gridTemplateColumns: cs.gridTemplateColumns,
        gap: cs.gap,
        x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
        childCount: el.children.length,
      }
    }),
  }
})

console.log(JSON.stringify(imgInfo, null, 2))

// Try also looking at the framer-rendered cells (album tiles even without imgs)
const cells = await page.evaluate(() => {
  // After scroll, find all square-aspect elements between the label and the caption
  const captionEl = (() => {
    for (const el of document.querySelectorAll('*')) {
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('').toLowerCase()
      if (own.includes('in no particular order')) return el
    }
    return null
  })()
  if (!captionEl) return null
  const cR = captionEl.getBoundingClientRect()
  const candidates = []
  for (const el of document.querySelectorAll('div')) {
    const r = el.getBoundingClientRect()
    if (r.top < cR.top - 800 || r.top > cR.top) continue
    if (r.width < 100 || r.width > 400) continue
    const ratio = r.width / r.height
    if (ratio < 0.85 || ratio > 1.15) continue
    if (el.children.length > 5) continue
    candidates.push({
      tag: el.tagName,
      cls: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
      x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
      bg: getComputedStyle(el).backgroundColor,
      hasImg: !!el.querySelector('img'),
      imgSrc: el.querySelector('img')?.src,
    })
  }
  return candidates
})
console.log('\nSQUARE CELLS:')
console.log(JSON.stringify(cells, null, 2))

await browser.close()
