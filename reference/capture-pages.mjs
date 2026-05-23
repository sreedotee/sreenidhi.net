import puppeteer from 'puppeteer'

const pages = [
  { name: 'whatido',  url: 'https://sreedotee.framer.website/what-i-do' },
  { name: 'play',     url: 'https://sreedotee.framer.website/play' },
  { name: 'about',    url: 'https://sreedotee.framer.website/about' },
  { name: 'contact',  url: 'https://sreedotee.framer.website/contact' },
]

const browser = await puppeteer.launch({ headless: 'new' })

for (const p of pages) {
  console.log(`==> ${p.name}: ${p.url}`)
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.goto(p.url, { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 4000))

  const total = await page.evaluate(() => document.body.scrollHeight)
  console.log(`   height=${total}`)

  // Full-page
  await page.screenshot({ path: `reference/page-${p.name}-full.png`, fullPage: true })

  // Scroll viewport captures
  const steps = []
  for (let y = 0; y < total; y += 900) steps.push(y)
  for (let i = 0; i < Math.min(steps.length, 10); i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), steps[i])
    await new Promise((r) => setTimeout(r, 900))
    await page.screenshot({ path: `reference/page-${p.name}-${String(i).padStart(2,'0')}.png` })
  }
  await page.close()
}

await browser.close()
console.log('Done.')
