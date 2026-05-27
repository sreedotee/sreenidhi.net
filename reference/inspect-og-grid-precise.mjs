import puppeteer from 'puppeteer'
import fs from 'fs'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 2400 })
await page.goto('https://sreedotee.framer.website/about', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 4000))

// Scroll music grid into view, leaving room above
await page.evaluate(() => {
  for (const el of document.querySelectorAll('*')) {
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('').toLowerCase()
    if (own === 'i love music') {
      el.scrollIntoView({ block: 'center' })
      return
    }
  }
})
await new Promise((r) => setTimeout(r, 2500))

const layout = await page.evaluate(() => {
  function findText(text) {
    for (const el of document.querySelectorAll('*')) {
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('').toLowerCase()
      if (own === text.toLowerCase()) return el
    }
    return null
  }
  const labelEl = findText('i love music')
  const capEl = findText('in no particular order.')
  const labelRect = labelEl?.getBoundingClientRect().toJSON()
  const capRect = capEl?.getBoundingClientRect().toJSON()
  // Find the grid (any flex with 4 square-ish children, contained in the music section)
  const rows = []
  for (const el of document.querySelectorAll('div')) {
    const cs = getComputedStyle(el)
    if (cs.display !== 'flex') continue
    if (el.children.length !== 4) continue
    const r = el.getBoundingClientRect()
    if (r.width < 800) continue
    rows.push({
      y: Math.round(r.top), x: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height),
      gap: cs.gap,
      cells: [...el.children].map((cell) => {
        const cr = cell.getBoundingClientRect()
        const img = cell.querySelector('img')
        const txt = [...cell.querySelectorAll('*')]
          .map(n => [...n.childNodes].filter(c => c.nodeType === 3).map(c => c.textContent.trim()).join(''))
          .filter(Boolean).join(' | ')
          .slice(0, 60)
        return {
          x: Math.round(cr.left), y: Math.round(cr.top), w: Math.round(cr.width),
          hasImg: !!img,
          imgSrc: img?.src,
          text: txt,
          bg: getComputedStyle(cell.firstElementChild || cell).backgroundColor,
        }
      })
    })
  }
  // Dedupe by y, take rows that look like the music grid (~283px tall cells, ~150x left)
  const seen = new Set()
  const uniqueRows = rows.filter((r) => {
    if (seen.has(r.y)) return false
    seen.add(r.y)
    return r.cells[0].w > 200 && r.cells[0].w < 350
  }).sort((a, b) => a.y - b.y)

  return { labelRect, capRect, rows: uniqueRows }
})

console.log('label "i love music" rect:', layout.labelRect)
console.log('caption "in no particular order" rect:', layout.capRect)
console.log()
console.log('Grid rows:')
for (let i = 0; i < layout.rows.length; i++) {
  const row = layout.rows[i]
  console.log(`Row ${i} at y=${row.y}, x=${row.x}, gap=${row.gap}`)
  for (let j = 0; j < row.cells.length; j++) {
    const c = row.cells[j]
    const flag = c.hasImg ? '🖼️' : (c.text ? '🔤' : '⬜')
    console.log(`  [${i},${j}] x=${c.x} y=${c.y} w=${c.w} ${flag} ${c.text ? '"' + c.text + '"' : ''}`)
  }
}

await browser.close()
