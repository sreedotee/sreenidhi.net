import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://sreedotee.framer.website/', { waitUntil: 'networkidle0', timeout: 60000 })

await page.evaluate(() => {
  const h = [...document.querySelectorAll('h1,h2,h3,h4,p,div')].find(
    (el) => (el.innerText || '').trim().toLowerCase() === 'creative coding'
  )
  if (h) h.scrollIntoView({ block: 'start' })
})
await new Promise((r) => setTimeout(r, 1500))

// Find Cloud Nine row
const row = await page.evaluateHandle(() => {
  return [...document.querySelectorAll('a, div')].find((el) => {
    const t = (el.innerText || '').trim()
    const r = el.getBoundingClientRect()
    return t.startsWith('Cloud Nine') && r.height > 30 && r.height < 120 && r.width > 600
  }) || null
})

const box = await row.evaluate((el) => {
  const r = el.getBoundingClientRect()
  return { x: r.x, y: r.y, w: r.width, h: r.height }
})
console.log('Row box:', box)

// Snapshot ALL img elements and any element with transform/opacity
const snap = async (label) => {
  const data = await page.evaluate(() => {
    return [...document.querySelectorAll('img')]
      .filter((el) => {
        const r = el.getBoundingClientRect()
        return r.width >= 40 && r.width <= 400 && r.height >= 40 && r.height <= 400
      })
      .map((el) => {
        const cs = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        return {
          src: (el.src || '').slice(-60),
          opacity: cs.opacity,
          position: cs.position,
          x: Math.round(r.x),
          y: Math.round(r.y),
          w: Math.round(r.width),
          h: Math.round(r.height),
          transform: cs.transform.slice(0, 80),
        }
      })
  })
  console.log(`\n=== ${label} ===`)
  console.log(JSON.stringify(data, null, 2))
}

await snap('BEFORE hover')

await page.mouse.move(box.x + box.w * 0.5, box.y + box.h * 0.5)
await new Promise((r) => setTimeout(r, 700))
await snap('AFTER hover @ center')

await page.mouse.move(box.x + box.w * 0.2, box.y + box.h * 0.5)
await new Promise((r) => setTimeout(r, 400))
await snap('AFTER hover @ left 20%')

await page.mouse.move(box.x + box.w * 0.8, box.y + box.h * 0.5)
await new Promise((r) => setTimeout(r, 400))
await snap('AFTER hover @ right 80%')

await browser.close()
