import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 })
await new Promise((r) => setTimeout(r, 2000))

const totalH = await page.evaluate(() => document.body.scrollHeight)
for (let y = 0; y < totalH; y += 500) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y)
  await new Promise((r) => setTimeout(r, 150))
}
await page.evaluate(() => window.scrollTo(0, 0))
await new Promise((r) => setTimeout(r, 500))

const data = await page.evaluate(() => {
  const sections = [
    { sel: '.A-hero', name: 'Hero' },
    { sel: '#work', name: 'Selected Work' },
    { sel: '#creative', name: 'Creative Coding' },
    { sel: '#play', name: 'Play' },
    { sel: '#tools', name: 'Tools' },
    { sel: '#testimonials', name: 'Testimonials' },
    { sel: '#trifecta', name: 'Trifecta' },
  ]
  const out = []
  let prev = null
  for (const s of sections) {
    const el = document.querySelector(s.sel)
    if (!el) continue
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const y = Math.round(r.top + window.scrollY)
    const h = Math.round(r.height)
    out.push({
      name: s.name,
      y,
      h,
      paddingTop: cs.paddingTop,
      paddingBottom: cs.paddingBottom,
      gapAbove: prev ? y - (prev.y + prev.h) : 0,
    })
    prev = { y, h }
  }
  return out
})

console.log('=== OUR SITE SECTION POSITIONS ===')
console.table(data)

await browser.close()
