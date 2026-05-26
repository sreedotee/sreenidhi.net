import puppeteer from 'puppeteer'
import fs from 'fs'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://www.synapserstudio.com/', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 4000))

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5))
await new Promise((r) => setTimeout(r, 2500))

// Find a target word and put the cursor near it
const target = await page.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find((e) => {
    const own = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('')
    return own === 'precision'
  })
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
})

console.log('Target precision:', target)

// Move cursor far off the constellation first
await page.mouse.move(1300, 850, { steps: 10 })
await new Promise((r) => setTimeout(r, 1500))

// === Phase 1: capture orbital drift WITH NO CURSOR INTERACTION ===
// Mouse parked off the constellation
const driftFrames = []
for (let i = 0; i < 16; i++) {
  await new Promise((r) => setTimeout(r, 80))
  const positions = await page.evaluate(() => {
    return [...document.querySelectorAll('div, span')]
      .filter((el) => {
        const cs = getComputedStyle(el)
        if (cs.position !== 'absolute' && cs.position !== 'fixed') return false
        if (!cs.fontFamily.toLowerCase().includes('newsreader')) return false
        const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('')
        return own && own.length < 30
      })
      .map((el) => {
        const r = el.getBoundingClientRect()
        const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('')
        return { text: own, x: r.left + r.width / 2, y: r.top + r.height / 2 }
      })
  })
  driftFrames.push({ t: i * 80, positions })
}
fs.writeFileSync('reference/synapser-drift-noCursor.json', JSON.stringify(driftFrames, null, 2))
console.log(`Captured ${driftFrames.length} drift-only frames`)

// === Phase 2: snap cursor onto the precision word and watch what happens ===
if (target) {
  await page.mouse.move(target.x, target.y, { steps: 5 })
  await new Promise((r) => setTimeout(r, 100))

  const hoverFrames = []
  for (let i = 0; i < 16; i++) {
    await new Promise((r) => setTimeout(r, 80))
    const positions = await page.evaluate(() => {
      return [...document.querySelectorAll('div, span')]
        .filter((el) => {
          const cs = getComputedStyle(el)
          if (cs.position !== 'absolute' && cs.position !== 'fixed') return false
          if (!cs.fontFamily.toLowerCase().includes('newsreader')) return false
          const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('')
          return own && own.length < 30
        })
        .map((el) => {
          const r = el.getBoundingClientRect()
          const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('')
          return { text: own, x: r.left + r.width / 2, y: r.top + r.height / 2 }
        })
    })
    hoverFrames.push({ t: i * 80, mouseX: target.x, mouseY: target.y, positions })
  }
  fs.writeFileSync('reference/synapser-drift-onPrecision.json', JSON.stringify(hoverFrames, null, 2))
  console.log(`Captured ${hoverFrames.length} on-hover frames`)
  await page.screenshot({ path: 'reference/synapser-stationary-on-precision.png', fullPage: false })
}

await browser.close()
console.log('Done')
