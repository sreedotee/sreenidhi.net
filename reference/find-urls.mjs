import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://sreedotee.framer.website/', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 3000))

const links = await page.evaluate(() => {
  const out = []
  const seen = new Set()
  for (const a of document.querySelectorAll('a')) {
    const text = (a.textContent || '').trim()
    const href = a.href
    if (!href || seen.has(href)) continue
    seen.add(href)
    if (href.includes('sreedotee.framer.website')) out.push({ text: text.slice(0, 60), href })
  }
  return out
})
console.log(JSON.stringify(links, null, 2))
await browser.close()
