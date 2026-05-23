import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://sreedotee.framer.website/', { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5000))

const totalH = await page.evaluate(() => document.body.scrollHeight)
for (let y = 0; y < totalH; y += 600) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y)
  await new Promise((r) => setTimeout(r, 200))
}
await new Promise((r) => setTimeout(r, 800))

const info = await page.evaluate(() => {
  // Look for elements with a quote-mark-like character
  const all = [...document.querySelectorAll('body *')]
  const candidates = []
  for (const el of all) {
    const t = (el.textContent || '').trim()
    if (t.length > 0 && t.length < 5) {
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).filter(Boolean).join('')
      if (own && (own.includes('"') || own.includes('"') || own.includes('"') || own.includes('❝') || own.includes('❞') || own.charCodeAt(0) > 8000)) {
        const cs = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        candidates.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className?.toString?.() || '').slice(0, 60),
          text: own,
          unicode: own.split('').map(c => `U+${c.charCodeAt(0).toString(16).padStart(4, '0').toUpperCase()}`).join(' '),
          fontFamily: cs.fontFamily,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          fontStyle: cs.fontStyle,
          color: cs.color,
          width: Math.round(r.width),
          height: Math.round(r.height),
        })
      }
    }
  }
  return candidates.slice(0, 15)
})

console.log(JSON.stringify(info, null, 2))
await browser.close()
