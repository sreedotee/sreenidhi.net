import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://sreedotee.framer.website/', { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5000))

const totalH = await page.evaluate(() => document.body.scrollHeight)
for (let y = 0; y < totalH; y += 500) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y)
  await new Promise((r) => setTimeout(r, 200))
}
await page.evaluate(() => window.scrollTo(0, 0))
await new Promise((r) => setTimeout(r, 800))

const data = await page.evaluate(() => {
  // Get all section-like elements (sections and main divs that visually break the page)
  const candidates = [...document.querySelectorAll('section, main > div, main > section')]

  // Also find section boundaries by looking at known eyebrow texts
  const markers = [
    { name: 'Hero', text: 'Attention is currency' },
    { name: 'About paragraph', text: '(01) ABOUT' },
    { name: 'Projects heading', text: 'Projects' },
    { name: 'Creative Coding', text: 'Creative Coding' },
    { name: 'Tools', text: '(02) TOOLS I USE' },
    { name: 'What I Do', text: '(03) WHAT I DO' },
    { name: 'Testimonials', text: '(03) TESTIMONIALS' },
  ]

  const positions = []
  for (const marker of markers) {
    const els = [...document.querySelectorAll('*')]
    const match = els.find((el) => (el.innerText || '').trim().toLowerCase().includes(marker.text.toLowerCase()) && el.children.length === 0)
    if (match) {
      const r = match.getBoundingClientRect()
      positions.push({
        marker: marker.name,
        text: match.innerText.trim().slice(0, 50),
        y: Math.round(r.top + window.scrollY),
        h: Math.round(r.height),
      })
    }
  }

  // Sort by y position
  positions.sort((a, b) => a.y - b.y)

  // Compute gaps between consecutive markers
  const gaps = []
  for (let i = 1; i < positions.length; i++) {
    gaps.push({
      from: positions[i - 1].marker,
      to: positions[i].marker,
      gap: positions[i].y - positions[i - 1].y,
    })
  }

  // Also compute padding on each main framer section
  const sections = [...document.querySelectorAll('section')].slice(0, 15).map((s) => {
    const cs = getComputedStyle(s)
    const r = s.getBoundingClientRect()
    return {
      cls: (s.className?.toString?.() || '').slice(0, 40),
      id: s.id,
      y: Math.round(r.top + window.scrollY),
      h: Math.round(r.height),
      paddingTop: cs.paddingTop,
      paddingBottom: cs.paddingBottom,
      marginTop: cs.marginTop,
      marginBottom: cs.marginBottom,
    }
  })

  return { positions, gaps, sections }
})

console.log('=== OG MARKER POSITIONS ===')
console.table(data.positions)
console.log('\n=== OG GAPS BETWEEN MARKERS (y-delta) ===')
console.table(data.gaps)
console.log('\n=== OG SECTION COMPUTED STYLES ===')
console.table(data.sections)

await browser.close()
