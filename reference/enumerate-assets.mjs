import puppeteer from 'puppeteer'
import fs from 'fs'

const PAGES = [
  { slug: 'home', url: 'https://sreedotee.framer.website/' },
  { slug: 'atelia', url: 'https://sreedotee.framer.website/projects/product-design' },
  { slug: 'whering', url: 'https://sreedotee.framer.website/projects/redesign' },
  { slug: 'golden-group', url: 'https://sreedotee.framer.website/projects/web-design' },
  { slug: 'sku-coverage', url: 'https://sreedotee.framer.website/projects/b2b-design' },
  { slug: 'play', url: 'https://sreedotee.framer.website/play' },
  { slug: 'about', url: 'https://sreedotee.framer.website/about' },
  { slug: 'what-i-do', url: 'https://sreedotee.framer.website/what-i-do' },
]

const browser = await puppeteer.launch({ headless: 'new' })
const all = []

for (const p of PAGES) {
  console.log(`\n=== ${p.slug}: ${p.url} ===`)
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  try {
    await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  } catch (e) {
    console.log(`  failed: ${e.message}`)
    await page.close()
    continue
  }
  await new Promise((r) => setTimeout(r, 4000))

  // Scroll through to force lazy load
  const totalH = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < totalH; y += 600) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y)
    await new Promise((r) => setTimeout(r, 250))
  }

  const imgs = await page.evaluate(() => {
    const all = [...document.querySelectorAll('img')]
    return all.map((img) => {
      const r = img.getBoundingClientRect()
      // Walk up to find a meaningful context (closest class/id)
      let context = ''
      let n = img.parentElement
      for (let i = 0; i < 6 && n; i++) {
        const c = (n.className?.toString?.() || '').slice(0, 60)
        if (c) { context = c; break }
        n = n.parentElement
      }
      return {
        src: img.src,
        srcset: img.srcset?.slice(0, 200) || '',
        naturalW: img.naturalWidth,
        naturalH: img.naturalHeight,
        renderedW: Math.round(r.width),
        renderedH: Math.round(r.height),
        alt: img.alt?.slice(0, 60) || '',
        context,
      }
    }).filter(img => img.src && !img.src.includes('framerusercontent.com/modules/'))
  })

  console.log(`  ${imgs.length} images`)
  all.push({ slug: p.slug, url: p.url, images: imgs })
  await page.close()
}

await browser.close()

fs.writeFileSync('reference/og-assets-manifest.json', JSON.stringify(all, null, 2))
console.log(`\nManifest written to reference/og-assets-manifest.json`)

// Summary
const total = all.reduce((s, p) => s + p.images.length, 0)
const uniqueSrcs = new Set(all.flatMap(p => p.images.map(i => i.src.split('?')[0])))
console.log(`\nTotal image elements: ${total}`)
console.log(`Unique image URLs (base): ${uniqueSrcs.size}`)
