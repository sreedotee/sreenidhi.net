import puppeteer from 'puppeteer'
import fs from 'fs'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 2400 })  // tall viewport so we see the whole grid
await page.goto('https://sreedotee.framer.website/about', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 4000))

// Scroll to the grid
await page.evaluate(() => {
  for (const el of document.querySelectorAll('*')) {
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('').toLowerCase()
    if (own === 'i love music') {
      el.scrollIntoView({ block: 'start' })
      return
    }
  }
})
await new Promise((r) => setTimeout(r, 2500))
await page.screenshot({ path: 'reference/og-music-full.png', fullPage: false })

// Capture all images in the section, plus the inferred grid cells
const data = await page.evaluate(() => {
  const labelEl = (() => {
    for (const el of document.querySelectorAll('*')) {
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('').toLowerCase()
      if (own === 'i love music') return el
    }
    return null
  })()
  if (!labelEl) return null

  let container = labelEl
  for (let i = 0; i < 12; i++) {
    container = container.parentElement || container
    if (container.querySelectorAll('img').length >= 1 && container.children.length >= 3) break
  }

  // Look for rows: flex containers with multiple square children
  const rows = []
  for (const el of container.querySelectorAll('*')) {
    const cs = getComputedStyle(el)
    if (cs.display !== 'flex') continue
    const r = el.getBoundingClientRect()
    if (r.width < 800) continue
    if (el.children.length !== 4) continue
    rows.push({
      y: Math.round(r.top),
      cells: [...el.children].map((cell) => {
        const cr = cell.getBoundingClientRect()
        const img = cell.querySelector('img')
        const bg = cell.querySelector('div') ? getComputedStyle(cell.querySelector('div')).backgroundColor : ''
        return {
          x: Math.round(cr.left),
          y: Math.round(cr.top),
          w: Math.round(cr.width),
          h: Math.round(cr.height),
          imgSrc: img?.src,
          imgAlt: img?.alt,
          bg,
        }
      }),
    })
  }
  // Dedupe by y
  const seen = new Set()
  const uniqueRows = rows.filter((row) => {
    if (seen.has(row.y)) return false
    seen.add(row.y)
    return true
  }).sort((a, b) => a.y - b.y)

  return {
    rows: uniqueRows,
    allImgs: [...container.querySelectorAll('img')].map((img) => ({
      src: img.src, alt: img.alt,
      r: img.getBoundingClientRect().toJSON(),
    })),
  }
})

console.log(JSON.stringify(data, null, 2))
await browser.close()
