import puppeteer from 'puppeteer'

const TARGET = 'https://sreedotee.framer.website/'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
await page.goto(TARGET, { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 4000))

// Try to find ALL scrollable elements and report
const info = await page.evaluate(() => {
  const all = Array.from(document.querySelectorAll('*'))
  const scrollers = []
  for (const el of all) {
    const cs = getComputedStyle(el)
    if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
      scrollers.push({
        tag: el.tagName,
        cls: el.className.toString().slice(0, 80),
        sh: el.scrollHeight,
        ch: el.clientHeight,
      })
    }
  }
  return {
    docHeight: document.documentElement.scrollHeight,
    bodyHeight: document.body.scrollHeight,
    windowHeight: window.innerHeight,
    scrollers,
  }
})
console.log(JSON.stringify(info, null, 2))

// Force-scroll using human-like scroll
const targets = [0, 900, 1800, 2700, 3600, 4500, 5400, 6300, 7200]
for (let i = 0; i < targets.length; i++) {
  const y = targets[i]
  await page.evaluate((scrollY) => {
    window.scrollTo({ top: scrollY, behavior: 'instant' })
    document.documentElement.scrollTop = scrollY
    document.body.scrollTop = scrollY
  }, y)
  await new Promise((r) => setTimeout(r, 1500))

  const actualY = await page.evaluate(() => window.scrollY)
  console.log(`requested ${y}, actual ${actualY}`)

  await page.screenshot({
    path: `reference/scroll-${String(i).padStart(2, '0')}.png`,
  })
}

await browser.close()
