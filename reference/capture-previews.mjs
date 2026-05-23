import puppeteer from 'puppeteer'

const pages = [
  { name: 'preview-index', url: 'http://localhost:5173/preview/' },
  { name: 'preview-a',     url: 'http://localhost:5173/preview-a/' },
  { name: 'preview-b',     url: 'http://localhost:5173/preview-b/' },
  { name: 'preview-c',     url: 'http://localhost:5173/preview-c/' },
]

const browser = await puppeteer.launch({ headless: 'new' })

for (const p of pages) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  try {
    await page.goto(p.url, { waitUntil: 'networkidle0', timeout: 20000 })
    await new Promise((r) => setTimeout(r, 1200))
    await page.screenshot({ path: `reference/${p.name}-top.png` })
    await page.screenshot({ path: `reference/${p.name}-full.png`, fullPage: true })
    console.log('ok', p.name)
  } catch (e) {
    console.log('fail', p.name, e.message.slice(0, 80))
  }
  await page.close()
}

await browser.close()
