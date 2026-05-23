import puppeteer from 'puppeteer'

const pages = [
  { name: 'home',    url: 'http://localhost:5173/' },
  { name: 'whatido', url: 'http://localhost:5173/what-i-do/' },
  { name: 'play',    url: 'http://localhost:5173/play/' },
  { name: 'about',   url: 'http://localhost:5173/about/' },
  { name: 'contact', url: 'http://localhost:5173/contact/' },
]

const browser = await puppeteer.launch({ headless: 'new' })

for (const p of pages) {
  console.log(p.name)
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  try {
    await page.goto(p.url, { waitUntil: 'networkidle0', timeout: 30000 })
  } catch (e) {
    console.log('  navigation issue:', e.message)
  }
  await new Promise((r) => setTimeout(r, 1500))
  await page.screenshot({ path: `reference/mine-page-${p.name}.png` })
  await page.close()
}

await browser.close()
console.log('done')
