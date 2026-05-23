import puppeteer from 'puppeteer'
import fs from 'fs'

const PAGES = [
  { slug: 'home', url: 'https://sreedotee.framer.website/' },
  { slug: 'about', url: 'https://sreedotee.framer.website/about' },
  { slug: 'play', url: 'https://sreedotee.framer.website/play' },
  { slug: 'atelia', url: 'https://sreedotee.framer.website/projects/product-design' },
  { slug: 'whering', url: 'https://sreedotee.framer.website/projects/redesign' },
  { slug: 'golden-group', url: 'https://sreedotee.framer.website/projects/web-design' },
  { slug: 'sku-coverage', url: 'https://sreedotee.framer.website/projects/b2b-design' },
]

const browser = await puppeteer.launch({ headless: 'new' })
const findings = {}

for (const p of PAGES) {
  console.log(`\n=== ${p.slug} ===`)
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  try {
    await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  } catch (e) {
    console.log(`  failed: ${e.message}`)
    await page.close()
    continue
  }
  await new Promise((r) => setTimeout(r, 5000))

  const totalH = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < totalH; y += 500) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y)
    await new Promise((r) => setTimeout(r, 200))
  }

  const pageData = await page.evaluate(() => {
    // Gather all meaningful text content as full paragraphs
    const textBlocks = []
    const all = [...document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote')]
    for (const el of all) {
      const t = (el.innerText || '').trim()
      if (t.length > 20 && t.length < 2000) {
        textBlocks.push({
          tag: el.tagName.toLowerCase(),
          text: t,
          fontFamily: getComputedStyle(el).fontFamily.split(',')[0].replace(/"/g, ''),
          fontSize: getComputedStyle(el).fontSize,
        })
      }
    }

    // Find videos / iframes
    const videos = [...document.querySelectorAll('video')].map((v) => ({
      tag: 'video',
      src: v.src || (v.querySelector('source') ? v.querySelector('source').src : ''),
      poster: v.poster || '',
      width: v.videoWidth || v.width,
      height: v.videoHeight || v.height,
    }))
    const iframes = [...document.querySelectorAll('iframe')].map((f) => ({
      tag: 'iframe',
      src: f.src,
      width: f.width || f.offsetWidth,
      height: f.height || f.offsetHeight,
    }))

    return { textBlocks, videos: [...videos, ...iframes] }
  })

  findings[p.slug] = pageData
  console.log(`  ${pageData.textBlocks.length} text blocks, ${pageData.videos.length} video/iframe elements`)

  await page.close()
}

await browser.close()
fs.writeFileSync('reference/deep-crawl-findings.json', JSON.stringify(findings, null, 2))
console.log(`\nWritten to reference/deep-crawl-findings.json`)

// Print just the key findings
console.log('\n=== TESTIMONIAL QUOTES (from home page) ===')
const home = findings.home || { textBlocks: [], videos: [] }
const quoteCandidates = home.textBlocks.filter((b) => b.text.length > 100 && (b.text.startsWith('They') || b.text.startsWith('Their') || /design|brand|interaction|product/i.test(b.text)))
quoteCandidates.forEach((q) => console.log(`[${q.fontSize} ${q.tag}] ${q.text.slice(0, 200)}...`))

console.log('\n=== ABOUT PAGE CONTENT ===')
const about = findings.about || { textBlocks: [], videos: [] }
about.textBlocks.forEach((b) => console.log(`[${b.tag} ${b.fontSize}] ${b.text.slice(0, 300)}`))

console.log('\n=== VIDEOS/IFRAMES FOUND ===')
for (const slug of Object.keys(findings)) {
  const vids = findings[slug].videos
  if (vids.length > 0) {
    console.log(`\n  ${slug}:`)
    vids.forEach((v) => console.log(`    ${v.tag}: ${v.src} (${v.width}x${v.height})`))
  }
}
