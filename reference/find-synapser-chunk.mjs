import puppeteer from 'puppeteer'
import fs from 'fs'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

// Collect all JS chunk URLs as they load
const chunks = []
page.on('response', async (resp) => {
  const url = resp.url()
  if (url.includes('/_next/static/chunks/') && url.endsWith('.js') || url.includes('/_next/static/chunks/') && url.includes('.js?')) {
    try {
      const text = await resp.text()
      chunks.push({ url, length: text.length, body: text })
    } catch (e) {}
  }
})

await page.goto('https://www.synapserstudio.com/', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5000))

console.log(`Captured ${chunks.length} chunks`)

// Search for the word "precision" - it's a distinctive constellation word
const candidates = chunks.filter((c) => /\bprecision\b/.test(c.body) && /\binnovation\b/.test(c.body))
console.log(`Chunks containing both "precision" and "innovation": ${candidates.length}`)
for (const c of candidates) {
  console.log('  ', c.url.split('/').slice(-1)[0], `(${c.length} bytes)`)
}

// Save matching chunks for inspection
if (!fs.existsSync('reference/chunks')) fs.mkdirSync('reference/chunks', { recursive: true })
for (const c of candidates) {
  const name = c.url.split('/').slice(-1)[0].split('?')[0]
  fs.writeFileSync(`reference/chunks/${name}`, c.body)
  // Also extract a window around the word
  const idx = c.body.indexOf('precision')
  if (idx >= 0) {
    const snippet = c.body.slice(Math.max(0, idx - 500), idx + 1500)
    fs.writeFileSync(`reference/chunks/${name}.context.txt`, snippet)
  }
}

await browser.close()
console.log('Done')
