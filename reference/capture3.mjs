import puppeteer from 'puppeteer'

const TARGET = 'https://sreedotee.framer.website/'

const browser = await puppeteer.launch({
  headless: 'new',
})

const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 9000, deviceScaleFactor: 1 })
await page.goto(TARGET, { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 6000))

// Crop at known Y bands to get each section clearly
const bands = [
  { name: 'hero',     y: 0,    h: 1100 },
  { name: 'about',    y: 1100, h: 900 },
  { name: 'proj1',    y: 2000, h: 1100 },
  { name: 'proj2',    y: 3100, h: 1100 },
  { name: 'tools',    y: 4200, h: 800 },
  { name: 'whatido',  y: 5000, h: 900 },
  { name: 'testimon', y: 5900, h: 900 },
  { name: 'footer',   y: 6800, h: 1200 },
]

for (const b of bands) {
  await page.screenshot({
    path: `reference/band-${b.name}.png`,
    clip: { x: 0, y: b.y, width: 1440, height: b.h },
  })
  console.log('Wrote', b.name)
}

await browser.close()
