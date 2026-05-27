import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://sreedotee.framer.website/about', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 4000))

await page.screenshot({ path: 'reference/og-about-top.png', fullPage: false })

// Scroll through the page in chunks, screenshotting each
const height = await page.evaluate(() => document.body.scrollHeight)
console.log('Page height:', height)
const viewport = 900
const steps = Math.ceil(height / viewport)
for (let i = 0; i < steps; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), i * viewport)
  await new Promise((r) => setTimeout(r, 1200))
  const name = String(i).padStart(2, '0')
  await page.screenshot({ path: `reference/og-about-${name}.png`, fullPage: false })
}

// Inspect grid-ish sections
const grids = await page.evaluate(() => {
  const out = []
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el)
    if (cs.display !== 'grid') continue
    const r = el.getBoundingClientRect()
    if (r.width < 200 || r.height < 100) continue
    out.push({
      tag: el.tagName,
      cls: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
      cols: cs.gridTemplateColumns,
      rows: cs.gridTemplateRows,
      gap: cs.gap,
      w: Math.round(r.width),
      h: Math.round(r.height),
      childCount: el.children.length,
    })
  }
  return out
})
console.log('GRIDS:')
console.log(JSON.stringify(grids, null, 2))

await browser.close()
console.log('Done')
