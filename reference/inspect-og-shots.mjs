import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://sreedotee.framer.website/projects/web-design', {
  waitUntil: 'networkidle0',
  timeout: 60000,
})

// Find every element that looks like a showcase media: an <img>, <video>, or a div with a background-image
const shots = await page.evaluate(() => {
  const out = []
  const all = [...document.querySelectorAll('body *')]
  for (const el of all) {
    const cs = getComputedStyle(el)
    const tag = el.tagName.toLowerCase()
    const r = el.getBoundingClientRect()
    const w = Math.round(r.width)
    const h = Math.round(r.height)
    const looksLikeMedia =
      tag === 'img' ||
      tag === 'video' ||
      (cs.backgroundImage && cs.backgroundImage !== 'none' && w > 600 && h > 200)
    if (!looksLikeMedia) continue
    out.push({
      tag,
      cls: (el.className?.toString?.() || '').slice(0, 80),
      w,
      h,
      ratio: h ? (w / h).toFixed(2) : null,
      objectFit: cs.objectFit,
      aspectRatio: cs.aspectRatio,
      backgroundSize: cs.backgroundSize,
      backgroundPosition: cs.backgroundPosition,
      backgroundRepeat: cs.backgroundRepeat,
      width: cs.width,
      height: cs.height,
      maxWidth: cs.maxWidth,
      display: cs.display,
    })
  }
  return out
})

console.log('Found media elements:', shots.length)
console.log(JSON.stringify(shots.slice(0, 25), null, 2))

await browser.close()
