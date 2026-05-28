import puppeteer from 'puppeteer'
import fs from 'fs'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

// Collect all JS chunks
const chunks = []
page.on('response', async (resp) => {
  const url = resp.url()
  if (url.includes('/chunks/') && url.includes('.js')) {
    try {
      const text = await resp.text()
      chunks.push({ url, length: text.length, body: text })
    } catch (e) {}
  }
})

await page.goto('https://sreedotee.framer.website/', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5000))

console.log(`Captured ${chunks.length} chunks`)

// Find the Creative Coding section by text
const ccLoc = await page.evaluate(() => {
  for (const el of document.querySelectorAll('*')) {
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('')
    if (own === 'Creative Coding' || own.toLowerCase() === 'creative coding') {
      const r = el.getBoundingClientRect()
      // walk up to find a containing section
      let p = el
      for (let i = 0; i < 8; i++) p = p.parentElement || p
      return { found: true, y: r.top + window.scrollY }
    }
  }
  return { found: false }
})
console.log('Creative Coding heading:', ccLoc)
if (ccLoc.found) {
  await page.evaluate((y) => window.scrollTo(0, y - 80), ccLoc.y)
  await new Promise((r) => setTimeout(r, 1500))
}
await page.screenshot({ path: 'reference/og-cc-rest.png', fullPage: false })

// Hover over what looks like a row
const rowInfo = await page.evaluate(() => {
  const links = [...document.querySelectorAll('a')]
  const cc = links.filter((a) => {
    const t = a.textContent.toLowerCase()
    return t.includes('shader') || t.includes('horse') || t.includes('cloud') || t.includes('globe') || t.includes('horsin')
  })
  if (!cc.length) return null
  return cc.map(a => {
    const r = a.getBoundingClientRect()
    return { text: a.textContent.slice(0, 60), x: r.left, y: r.top, w: r.width, h: r.height }
  })
})
console.log('CC rows found:', rowInfo)

if (rowInfo && rowInfo.length) {
  // Hover the first row
  const r = rowInfo[0]
  await page.mouse.move(r.x + r.w / 2, r.y + r.h / 2)
  await new Promise((r2) => setTimeout(r2, 600))
  await page.screenshot({ path: 'reference/og-cc-hover.png', fullPage: false })

  // Move mouse around to see if preview follows
  for (let i = 0; i < 8; i++) {
    await page.mouse.move(r.x + 200 + i * 60, r.y + r.h / 2 + (i % 2 ? 10 : -10))
    await new Promise((r2) => setTimeout(r2, 100))
  }
  await page.screenshot({ path: 'reference/og-cc-hover-move.png', fullPage: false })
}

// Save the chunk that contains creative coding content
for (const c of chunks) {
  if (/Cloud Nine|Horsin'? Around|Creative Coding|Interactive Globe/i.test(c.body)) {
    const name = c.url.split('/').slice(-1)[0].split('?')[0]
    if (!fs.existsSync('reference/chunks')) fs.mkdirSync('reference/chunks', { recursive: true })
    fs.writeFileSync(`reference/chunks/cc-${name}`, c.body)
    console.log('saved chunk:', name, c.length, 'bytes')
  }
}

await browser.close()
