import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://sreedotee.framer.website/projects/product-design', { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5000))

const total = await page.evaluate(() => document.body.scrollHeight)
console.log('Page total height:', total)

// Full page screenshot
await page.screenshot({ path: 'reference/og-project-full.png', fullPage: true })

// Top viewport screenshot
await page.screenshot({ path: 'reference/og-project-00.png', fullPage: false })

// Scroll down in viewport-height steps and capture
for (let i = 1; i < Math.min(Math.ceil(total / 900), 8); i++) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), i * 900)
  await new Promise((r) => setTimeout(r, 600))
  await page.screenshot({ path: `reference/og-project-${String(i).padStart(2, '0')}.png`, fullPage: false })
}

// Scroll back to top
await page.evaluate(() => window.scrollTo(0, 0))
await new Promise((r) => setTimeout(r, 600))

// Inspect overall structure and key typography
const structure = await page.evaluate(() => {
  // Group elements by computed style + role
  const buckets = new Map()
  const all = [...document.querySelectorAll('body *')]
  for (const el of all) {
    if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT') continue
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).filter(Boolean).join(' ')
    if (!own) continue
    const cs = getComputedStyle(el)
    const key = [cs.fontFamily.split(',')[0], cs.fontSize, cs.fontWeight, cs.lineHeight, cs.letterSpacing, cs.color].join('|')
    if (!buckets.has(key)) buckets.set(key, { font: `${cs.fontFamily.split(',')[0].replace(/"/g,'')} ${cs.fontSize}/${cs.lineHeight} ${cs.fontWeight}`, color: cs.color, letterSpacing: cs.letterSpacing, samples: [] })
    const b = buckets.get(key)
    if (b.samples.length < 5) b.samples.push(own.slice(0, 80))
  }
  return [...buckets.values()].sort((a, b) => parseFloat(b.font.split(' ')[1]) - parseFloat(a.font.split(' ')[1]))
})

console.log('\n=== TYPOGRAPHY GROUPS ===')
console.log(JSON.stringify(structure.slice(0, 25), null, 2))

// Find the main section structures
const sections = await page.evaluate(() => {
  return [...document.querySelectorAll('section')].map((s, i) => {
    const r = s.getBoundingClientRect()
    return {
      i,
      cls: (s.className?.toString?.() || '').slice(0, 60),
      id: s.id,
      y: Math.round(r.y),
      h: Math.round(r.height),
      childCount: s.children.length,
    }
  })
})

console.log('\n=== SECTIONS ===')
console.log(JSON.stringify(sections, null, 2))

await browser.close()
