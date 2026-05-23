import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://sreedotee.framer.website/', { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5000))

// Scroll to find Creative Coding heading and the rows beneath it
const totalH = await page.evaluate(() => document.body.scrollHeight)
for (let y = 0; y < totalH; y += 600) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y)
  await new Promise((r) => setTimeout(r, 250))
}
await new Promise((r) => setTimeout(r, 1000))

// Scroll specifically to the CC area
await page.evaluate(() => {
  const all = [...document.querySelectorAll('h2')]
  const heading = all.find((h) => (h.innerText || '').trim().toLowerCase() === 'creative coding')
  if (heading) heading.scrollIntoView({ block: 'start', behavior: 'instant' })
})
await new Promise((r) => setTimeout(r, 1500))

// Find the 3 row anchors (Cloud Nine, Horsin' Around, Interactive Globe) and hover each one to surface preview images
const rowAnchors = await page.$$eval('a', (els) => {
  return els
    .filter((el) => {
      const t = (el.innerText || '').trim()
      return /Cloud Nine|Horsin|Interactive Globe/i.test(t) && el.getBoundingClientRect().height > 30
    })
    .map((el) => el.getAttribute('href') || '')
})

console.log('Found row anchors:', rowAnchors)

// Hover each row in sequence, then capture all images visible after hover
const allImagesAfterHover = new Map()

for (let i = 0; i < 3; i++) {
  try {
    const handle = await page.evaluateHandle((index) => {
      const all = [...document.querySelectorAll('a')]
      const matches = all.filter((el) => {
        const t = (el.innerText || '').trim()
        return /Cloud Nine|Horsin|Interactive Globe/i.test(t) && el.getBoundingClientRect().height > 30
      })
      return matches[index] || null
    }, i)
    if (await handle.evaluate((el) => !!el)) {
      await handle.hover()
      await new Promise((r) => setTimeout(r, 1200))
      const imgs = await page.evaluate(() => {
        return [...document.querySelectorAll('img')].map((img) => ({
          src: img.src,
          natural: { w: img.naturalWidth, h: img.naturalHeight },
          rendered: { w: Math.round(img.getBoundingClientRect().width), h: Math.round(img.getBoundingClientRect().height) },
          visible: img.getBoundingClientRect().width > 0 && img.getBoundingClientRect().height > 0,
        }))
      })
      const rowLabel = ['Cloud Nine', 'Horsin Around', 'Interactive Globe'][i]
      console.log(`\n--- After hovering row ${i} (${rowLabel}) ---`)
      const newImages = imgs.filter((img) => !allImagesAfterHover.has(img.src) && img.visible && img.natural.w > 50)
      for (const img of newImages) {
        console.log(`  NEW: ${img.src}`)
        console.log(`       natural=${img.natural.w}x${img.natural.h} rendered=${img.rendered.w}x${img.rendered.h}`)
        allImagesAfterHover.set(img.src, { row: rowLabel, ...img })
      }
    }
  } catch (e) {
    console.log(`  Hover ${i} failed: ${e.message}`)
  }
}

await browser.close()
console.log(`\nTotal new images discovered via hover: ${allImagesAfterHover.size}`)
