import puppeteer from 'puppeteer'
import fs from 'fs'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

// Collect chunks BEFORE navigating
const chunkPromises = []
page.on('response', (resp) => {
  const url = resp.url()
  if (url.includes('/chunks/') && url.includes('.js')) {
    chunkPromises.push(
      resp.text().then((body) => ({ url, body, length: body.length })).catch(() => null)
    )
  }
})

await page.goto('https://sreedotee.framer.website/', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5000))

const chunks = (await Promise.all(chunkPromises)).filter(Boolean)
console.log(`Captured ${chunks.length} chunks`)

const ccChunks = chunks.filter((c) => /Horsin'? Around|Cloud Nine|Interactive Globe|Needlework/i.test(c.body))
for (const c of ccChunks) {
  const name = c.url.split('/').slice(-1)[0].split('?')[0]
  if (!fs.existsSync('reference/chunks')) fs.mkdirSync('reference/chunks', { recursive: true })
  fs.writeFileSync(`reference/chunks/cc-${name}`, c.body)
  console.log('saved CC chunk:', name, c.length, 'bytes')
}

const ccY = await page.evaluate(() => {
  for (const el of document.querySelectorAll('*')) {
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('')
    if (own === 'Creative Coding') return el.getBoundingClientRect().top + window.scrollY
  }
  return null
})
if (ccY != null) {
  await page.evaluate((y) => window.scrollTo(0, y - 60), ccY)
  await new Promise((r) => setTimeout(r, 1500))
}

const rows = await page.evaluate(() => {
  const out = []
  for (const a of document.querySelectorAll('a')) {
    const t = a.textContent.toLowerCase()
    if (t.includes('cloud') || t.includes('horsin') || t.includes('globe')) {
      const r = a.getBoundingClientRect()
      out.push({ text: a.textContent.slice(0, 40), x: r.left, y: r.top, w: r.width, h: r.height })
    }
  }
  return out
})
console.log('rows:', rows)

const positions = []
if (rows.length >= 3) {
  const r1 = rows[0]
  for (const x of [r1.x + 100, r1.x + 400, r1.x + 700, r1.x + 1000, r1.x + 1300]) {
    positions.push({ x, y: r1.y + r1.h / 2, label: `row1-x${Math.round(x)}` })
  }
  positions.push({ x: rows[1].x + 500, y: rows[1].y + rows[1].h / 2, label: 'row2-mid' })
  positions.push({ x: rows[2].x + 800, y: rows[2].y + rows[2].h / 2, label: 'row3-far-right' })
}

for (const pos of positions) {
  await page.mouse.move(pos.x, pos.y, { steps: 8 })
  await new Promise((r) => setTimeout(r, 400))
  const previewInfo = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')]
    const candidates = imgs.map((img) => {
      const r = img.getBoundingClientRect()
      const cs = getComputedStyle(img)
      return {
        src: img.src,
        x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
        opacity: cs.opacity,
        transform: cs.transform,
        position: cs.position,
      }
    }).filter((x) => parseFloat(x.opacity) > 0.5 && x.w > 100 && x.w < 400 && x.h > 100 && x.h < 400 && x.y > 100 && x.y < 600)
    return candidates
  })
  console.log(`\n[${pos.label}] cursor at (${Math.round(pos.x)},${Math.round(pos.y)}) — preview:`)
  console.log(JSON.stringify(previewInfo, null, 2))
  await page.screenshot({ path: `reference/og-cc-${pos.label}.png`, fullPage: false })
}

await browser.close()
