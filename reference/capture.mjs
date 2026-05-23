import puppeteer from 'puppeteer'

const TARGET = 'https://sreedotee.framer.website/'

const browser = await puppeteer.launch({
  headless: 'new',
  defaultViewport: { width: 1440, height: 900 },
})

const page = await browser.newPage()
await page.goto(TARGET, { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 3000))

const totalHeight = await page.evaluate(() => document.body.scrollHeight)
console.log('Page total height:', totalHeight)

// Full page screenshot
await page.screenshot({
  path: 'reference/full-real.png',
  fullPage: true,
})
console.log('Wrote reference/full-real.png')

// Scroll to capture sections one viewport at a time
const viewportH = 900
let y = 0
let i = 0
while (y < totalHeight) {
  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y)
  await new Promise((r) => setTimeout(r, 800))
  await page.screenshot({
    path: `reference/section-${String(i).padStart(2, '0')}.png`,
    clip: { x: 0, y: 0, width: 1440, height: viewportH },
  })
  console.log(`section-${i} at scrollY=${y}`)
  y += viewportH
  i += 1
  if (i > 20) break
}

await browser.close()
console.log('Done.')
