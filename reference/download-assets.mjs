import fs from 'fs'
import path from 'path'
import https from 'https'

const manifest = JSON.parse(fs.readFileSync('reference/og-assets-manifest.json', 'utf-8'))
const outDir = 'public/og-assets'
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

// Group unique image URLs by their hash (the framerusercontent ID)
const seen = new Map() // hash → { url, ext, pages: [], renderedSize, contextHints }
for (const page of manifest) {
  for (const img of page.images) {
    const match = img.src.match(/framerusercontent\.com\/images\/([^.]+)\.([a-zA-Z]+)/)
    if (!match) continue
    const [, hash, ext] = match
    if (!seen.has(hash)) {
      seen.set(hash, { hash, url: img.src, ext, pages: [], renderedSizes: [], contexts: [], natural: { w: img.naturalW, h: img.naturalH } })
    }
    const rec = seen.get(hash)
    rec.pages.push(page.slug)
    rec.renderedSizes.push(`${img.renderedW}x${img.renderedH}`)
    rec.contexts.push(img.context)
  }
}

console.log(`Downloading ${seen.size} unique images to ${outDir}/`)

const download = (url, filepath) =>
  new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath)
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        file.close()
        fs.unlinkSync(filepath)
        return reject(new Error(`HTTP ${response.statusCode}`))
      }
      response.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
    }).on('error', (err) => {
      file.close()
      try { fs.unlinkSync(filepath) } catch {}
      reject(err)
    })
  })

const mapping = []
for (const [hash, rec] of seen) {
  const filename = `${hash}.${rec.ext}`
  const filepath = path.join(outDir, filename)
  const localPath = `/og-assets/${filename}`
  try {
    await download(rec.url, filepath)
    const size = fs.statSync(filepath).size
    console.log(`  ✓ ${filename} (${(size / 1024).toFixed(0)} KB) — used on: ${[...new Set(rec.pages)].join(', ')}`)
    mapping.push({
      hash,
      localPath,
      ext: rec.ext,
      ogUrl: rec.url,
      pages: [...new Set(rec.pages)],
      natural: rec.natural,
      sizeKB: Math.round(size / 1024),
      contextHints: [...new Set(rec.contexts)].slice(0, 3),
    })
  } catch (e) {
    console.log(`  ✗ ${filename} — ${e.message}`)
  }
}

fs.writeFileSync('reference/og-assets-mapping.json', JSON.stringify(mapping, null, 2))
console.log(`\nMapping written to reference/og-assets-mapping.json`)
