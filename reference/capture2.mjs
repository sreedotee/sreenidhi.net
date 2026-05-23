import puppeteer from 'puppeteer'

const TARGET = 'https://sreedotee.framer.website/'

const browser = await puppeteer.launch({
  headless: 'new',
  defaultViewport: { width: 1440, height: 900 },
})

const page = await browser.newPage()
// Set a very tall viewport so scroll-jacking can't hide content
await page.setViewport({ width: 1440, height: 8200 })
await page.goto(TARGET, { waitUntil: 'networkidle0', timeout: 60000 })
// Wait for animations & lazy content
await new Promise((r) => setTimeout(r, 5000))

await page.screenshot({
  path: 'reference/tall-viewport.png',
  fullPage: false,
})
console.log('Wrote tall-viewport.png')

await browser.close()
