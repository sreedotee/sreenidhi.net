import fs from 'fs'
import path from 'path'
import https from 'https'

// Images discovered via row-hover on the OG homepage CC section
const URLS = [
  { hash: 'upcauKlgquxgkGQjQbkGuVBSK8', ext: 'png', url: 'https://framerusercontent.com/images/upcauKlgquxgkGQjQbkGuVBSK8.png?width=1319&height=957', role: 'Cloud Nine preview' },
  { hash: 'maHEBDy8FnNwaka6cbLtQANEw', ext: 'png', url: 'https://framerusercontent.com/images/maHEBDy8FnNwaka6cbLtQANEw.png?width=1319&height=957', role: 'Horsin Around preview' },
  { hash: 'GfwBFWMHYRrHCz8rOoIugSJJ0lg', ext: 'png', url: 'https://framerusercontent.com/images/GfwBFWMHYRrHCz8rOoIugSJJ0lg.png?width=1276&height=898', role: 'Interactive Globe preview' },
  // Extras (visible during hover; might be for /play page entries)
  { hash: 'TXh7yYiQawsFZk2gXMtc4RJgc', ext: 'png', url: 'https://framerusercontent.com/images/TXh7yYiQawsFZk2gXMtc4RJgc.png?width=2802&height=1518', role: 'extra 1' },
  { hash: 'QxjUx5d3IhiPBl6PuPAdDB4AtL8', ext: 'png', url: 'https://framerusercontent.com/images/QxjUx5d3IhiPBl6PuPAdDB4AtL8.png?width=2940&height=1840', role: 'extra 2' },
  { hash: 'ef1X0x6GBH3e4yhckmEc20lIFk', ext: 'png', url: 'https://framerusercontent.com/images/ef1X0x6GBH3e4yhckmEc20lIFk.png?width=1400&height=900', role: 'extra 3' },
]

const outDir = 'public/og-assets'

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

for (const rec of URLS) {
  const filename = `${rec.hash}.${rec.ext}`
  const filepath = path.join(outDir, filename)
  try {
    await download(rec.url, filepath)
    const size = fs.statSync(filepath).size
    console.log(`  ✓ ${filename} (${(size / 1024).toFixed(0)} KB) — ${rec.role}`)
  } catch (e) {
    console.log(`  ✗ ${filename} — ${e.message}`)
  }
}
