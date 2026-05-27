import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 2400 })
await page.goto('https://sreedotee.framer.website/about', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 4000))

// Scroll the music grid into view
await page.evaluate(() => {
  for (const el of document.querySelectorAll('*')) {
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('').toLowerCase()
    if (own === 'i love music') {
      el.scrollIntoView({ block: 'start' })
      return
    }
  }
})
await new Promise((r) => setTimeout(r, 2500))

// Anchor: find the "i love music" element and compute its viewport y position
const anchor = await page.evaluate(() => {
  for (const el of document.querySelectorAll('*')) {
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('').toLowerCase()
    if (own === 'i love music') {
      const r = el.getBoundingClientRect()
      return { x: r.left, y: r.top }
    }
  }
  return null
})
if (!anchor) { console.log('Could not find anchor'); process.exit(1) }

// Watch the grid for 40 seconds, sampling every 400ms
const observations = {} // key = "row,col" → Set of imgSrcs seen there

function cellKey(x, y, anchorX, anchorY) {
  // Cells are 283px wide, 2px gap. Grid starts somewhere around anchor.
  // Quantize to nearest cell. Anchor "i love music" sits above the grid, so the grid starts roughly at anchorY + ~80px
  const gridStartX = 151  // captured from prior runs
  const gridStartY = anchorY + 60  // approximate
  const col = Math.round((x - gridStartX) / 285)
  const row = Math.round((y - gridStartY) / 285)
  return `${row},${col}`
}

const totalDurationMs = 40000
const sampleEvery = 400
const samples = Math.floor(totalDurationMs / sampleEvery)
console.log(`Sampling ${samples} times every ${sampleEvery}ms (${totalDurationMs/1000}s total)`)

for (let i = 0; i < samples; i++) {
  const data = await page.evaluate(() => {
    const imgs = []
    document.querySelectorAll('img').forEach((img) => {
      const r = img.getBoundingClientRect()
      // Only album-sized images
      if (r.width < 200 || r.width > 350) return
      const ratio = r.width / r.height
      if (ratio < 0.85 || ratio > 1.15) return
      if (img.src.includes('framerusercontent.com') || img.src.includes('images')) {
        imgs.push({ src: img.src, x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), opacity: getComputedStyle(img).opacity })
      }
    })
    return imgs
  })

  for (const img of data) {
    if (parseFloat(img.opacity) < 0.5) continue  // skip mid-fade dim image
    const key = cellKey(img.x, img.y, anchor.x, anchor.y)
    if (!observations[key]) observations[key] = new Set()
    observations[key].add(img.src)
  }

  if (i % 5 === 0) process.stdout.write(`.`)
  await new Promise((r) => setTimeout(r, sampleEvery))
}
console.log()

// Convert sets to arrays
const result = {}
for (const [k, v] of Object.entries(observations)) {
  result[k] = [...v]
}
fs.writeFileSync('reference/og-cell-map.json', JSON.stringify(result, null, 2))

// Tally unique images
const all = new Set()
for (const v of Object.values(observations)) for (const s of v) all.add(s)
console.log(`\nFound ${all.size} unique image URLs across ${Object.keys(observations).length} cell positions`)
for (const [k, v] of Object.entries(result)) {
  console.log(`  cell ${k}: ${v.length} image(s)`)
}

// Download all unique images
if (!fs.existsSync('public/albums')) fs.mkdirSync('public/albums', { recursive: true })
let n = 1
const filenameForUrl = {}
for (const url of all) {
  // Extract the framer id
  const m = url.match(/\/images\/([^?]+?)(?:\.webp|\.png|\.jpg)?(?:\?|$)/)
  const id = m ? m[1].replace(/\.(webp|png|jpg)$/, '') : `unknown-${n++}`
  filenameForUrl[url] = `${id}.webp`
}

// Write a manifest with cell → filenames mapping
const manifest = {}
for (const [k, urls] of Object.entries(result)) {
  manifest[k] = urls.map((u) => filenameForUrl[u])
}
fs.writeFileSync('reference/og-cell-manifest.json', JSON.stringify({ files: filenameForUrl, cells: manifest }, null, 2))

console.log('\nManifest written to reference/og-cell-manifest.json')
await browser.close()
