import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://sreedotee.framer.website/', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 3000))

const data = await page.evaluate(() => {
  const buckets = new Map()
  const all = Array.from(document.querySelectorAll('body *'))
  for (const el of all) {
    if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT') continue
    const own = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent.trim()).filter(Boolean).join(' ')
    if (!own) continue
    const cs = getComputedStyle(el)
    const key = [cs.fontFamily.split(',')[0], cs.fontSize, cs.fontWeight, cs.lineHeight, cs.letterSpacing, cs.color, cs.textTransform].join('|')
    if (!buckets.has(key)) buckets.set(key, { fontFamily: cs.fontFamily.split(',')[0].replace(/"/g, ''), fontSize: cs.fontSize, fontWeight: cs.fontWeight, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, color: cs.color, textTransform: cs.textTransform, samples: [] })
    const b = buckets.get(key)
    if (b.samples.length < 3) b.samples.push(own.slice(0, 80))
  }
  return [...buckets.values()].sort((a, b) => parseFloat(b.fontSize) - parseFloat(a.fontSize))
})

console.log(JSON.stringify(data, null, 2))
await browser.close()
