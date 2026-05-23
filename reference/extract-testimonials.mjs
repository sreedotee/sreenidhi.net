import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://sreedotee.framer.website/', { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5000))

const totalH = await page.evaluate(() => document.body.scrollHeight)
for (let y = 0; y < totalH; y += 500) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y)
  await new Promise((r) => setTimeout(r, 200))
}

// Scroll to testimonials section
await page.evaluate(() => {
  const all = [...document.querySelectorAll('p, h2')]
  const eyebrow = all.find((el) => (el.innerText || '').trim() === '(03) TESTIMONIALS')
  if (eyebrow) eyebrow.scrollIntoView({ block: 'start', behavior: 'instant' })
})
await new Promise((r) => setTimeout(r, 1500))

// Wait long enough for autoplay to cycle through all testimonials (typically 4-6s per slide)
// Capture quote text at intervals
const captured = []
for (let i = 0; i < 12; i++) {
  await new Promise((r) => setTimeout(r, 3500))
  const cur = await page.evaluate(() => {
    // Find the largest h3 by font-size (the active quote) AND the largest Meraki h3 (name)
    const all = [...document.querySelectorAll('h3')]
    const quote = all.find((el) => {
      const cs = getComputedStyle(el)
      return cs.fontFamily.includes('Geist') && parseFloat(cs.fontSize) > 30 && (el.innerText || '').length > 100
    })
    const names = all.filter((el) => {
      const cs = getComputedStyle(el)
      return cs.fontFamily.includes('Meraki') && parseFloat(cs.fontSize) > 30
    }).map((n) => n.innerText.trim())
    return { quote: quote?.innerText.trim() || '', names }
  })
  if (cur.quote && !captured.find((c) => c.quote === cur.quote)) {
    captured.push(cur)
    console.log(`\n--- Capture ${captured.length} ---`)
    console.log('QUOTE:', cur.quote)
    console.log('NAMES VISIBLE:', cur.names.join(' | '))
  }
  if (captured.length >= 3) break
}

await browser.close()
