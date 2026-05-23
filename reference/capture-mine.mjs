import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 })
await new Promise((r) => setTimeout(r, 2000))

await page.screenshot({ path: 'reference/mine-full.png', fullPage: true })
await page.screenshot({ path: 'reference/mine-hero.png' })

// Capture scroll positions for comparison
const totalH = await page.evaluate(() => document.body.scrollHeight)
console.log('mine total height', totalH)
const steps = [0, 900, 1800, 2700, 3600, 4500]
for (let i = 0; i < steps.length; i++) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), steps[i])
  await new Promise((r) => setTimeout(r, 600))
  await page.screenshot({ path: `reference/mine-${String(i).padStart(2,'0')}.png` })
}
await browser.close()
console.log('done')
