import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://www.synapserstudio.com/', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 3000))

await page.screenshot({ path: 'reference/synapser-hero.png', fullPage: false })

const data = await page.evaluate(() => {
  function describe(el) {
    if (!el) return null
    const cs = getComputedStyle(el)
    const rect = el.getBoundingClientRect()
    return {
      tag: el.tagName,
      text: (el.textContent || '').trim().slice(0, 120),
      fontFamily: cs.fontFamily.split(',')[0].replace(/"/g, ''),
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      color: cs.color,
      textAlign: cs.textAlign,
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
    }
  }
  // Try to capture top-level visible text nodes
  const candidates = []
  for (const el of document.querySelectorAll('body *')) {
    if (el.children.length) continue
    const txt = (el.textContent || '').trim()
    if (!txt) continue
    const r = el.getBoundingClientRect()
    if (r.top < 0 || r.top > 900 || r.width < 4) continue
    candidates.push(describe(el))
  }
  return candidates.sort((a, b) => a.y - b.y).slice(0, 30)
})

console.log(JSON.stringify(data, null, 2))
await browser.close()
