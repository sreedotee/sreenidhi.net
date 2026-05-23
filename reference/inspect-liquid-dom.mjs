import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new', args: ['--enable-unsafe-webgpu'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://liquid-dom-showcase.vercel.app', { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 6000))

await page.screenshot({ path: 'reference/liquid-dom-top.png', fullPage: false })

const total = await page.evaluate(() => document.body.scrollHeight)
console.log('Total page height:', total)

for (let i = 1; i < Math.min(Math.ceil(total / 900), 6); i++) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), i * 900)
  await new Promise((r) => setTimeout(r, 1200))
  await page.screenshot({ path: `reference/liquid-dom-${String(i).padStart(2, '0')}.png`, fullPage: false })
}

await browser.close()
