import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://sreedotee.framer.website/', { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5000))

// Scroll through to force lazy load
const totalH = await page.evaluate(() => document.body.scrollHeight)
for (let y = 0; y < totalH; y += 600) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y)
  await new Promise((r) => setTimeout(r, 300))
}

// Find the (03) TESTIMONIALS eyebrow and scroll its section to top
const sectionInfo = await page.evaluate(() => {
  const all = [...document.querySelectorAll('body *')]
  const eyebrow = all.find((el) => (el.innerText || '').trim() === '(03) TESTIMONIALS' && el.children.length === 0)
  if (!eyebrow) return null
  let section = eyebrow
  for (let i = 0; i < 12; i++) {
    if (!section.parentElement) break
    section = section.parentElement
    const h = section.getBoundingClientRect().height
    if (h > 400 && h < 1200) break
  }
  section.scrollIntoView({ block: 'start', behavior: 'instant' })
  return { found: true, h: Math.round(section.getBoundingClientRect().height) }
})

console.log('Section info:', JSON.stringify(sectionInfo))

await new Promise((r) => setTimeout(r, 1500))
await page.screenshot({ path: 'reference/og-testimonials-fresh.png', fullPage: false })

// Capture full inner HTML of section + sizes of all major child boxes
const dump = await page.evaluate(() => {
  const all = [...document.querySelectorAll('body *')]
  const eyebrow = all.find((el) => (el.innerText || '').trim() === '(03) TESTIMONIALS' && el.children.length === 0)
  let section = eyebrow
  for (let i = 0; i < 12; i++) {
    if (!section.parentElement) break
    section = section.parentElement
    const h = section.getBoundingClientRect().height
    if (h > 400 && h < 1200) break
  }
  const rows = [...section.querySelectorAll('div, p, h1, h2, h3, h4')]
    .filter((el) => {
      const r = el.getBoundingClientRect()
      return r.width > 200 && r.height > 20
    })
    .slice(0, 25)
    .map((el) => {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).filter(Boolean).join(' ')
      return {
        tag: el.tagName.toLowerCase(),
        cls: (el.className?.toString?.() || '').slice(0, 50),
        text: own.slice(0, 60),
        w: Math.round(r.width),
        h: Math.round(r.height),
        bg: cs.backgroundColor,
        padding: cs.padding,
        font: cs.fontFamily.split(',')[0] + ' ' + cs.fontSize + '/' + cs.lineHeight,
      }
    })
  return rows
})

console.log('Testimonials section internals:')
console.log(JSON.stringify(dump, null, 2))

await browser.close()
