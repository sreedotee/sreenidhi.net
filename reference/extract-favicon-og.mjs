import { writeFileSync, mkdirSync } from 'node:fs'

mkdirSync('public', { recursive: true })

const BASE = 'https://sreedotee.framer.website'

const html = await fetch(BASE).then(r => r.text())

// Parse relevant <link> and <meta> tags
const extract = (pattern) => html.match(pattern)?.[1] || null

const favicon      = extract(/rel="[^"]*icon[^"]*"[^>]*href="([^"]+)"/) ||
                     extract(/href="([^"]+)"[^>]*rel="[^"]*icon[^"]*"/)
const apple        = extract(/rel="apple-touch-icon"[^>]*href="([^"]+)"/) ||
                     extract(/href="([^"]+)"[^>]*rel="apple-touch-icon"/)
const ogImage      = extract(/property="og:image"\s+content="([^"]+)"/) ||
                     extract(/content="([^"]+)"\s+property="og:image"/)
const ogTitle      = extract(/property="og:title"\s+content="([^"]+)"/) ||
                     extract(/content="([^"]+)"\s+property="og:title"/)
const ogDesc       = extract(/property="og:description"\s+content="([^"]+)"/) ||
                     extract(/content="([^"]+)"\s+property="og:description"/)
const twitterImage = extract(/name="twitter:image"\s+content="([^"]+)"/) ||
                     extract(/content="([^"]+)"\s+name="twitter:image"/)
const twitterCard  = extract(/name="twitter:card"\s+content="([^"]+)"/) ||
                     extract(/content="([^"]+)"\s+name="twitter:card"/)

const meta = { favicon, apple, ogImage, ogTitle, ogDesc, twitterImage, twitterCard }
console.log('Meta:', JSON.stringify(meta, null, 2))

const resolve = (url) => url?.startsWith('http') ? url : url ? `${BASE}${url}` : null

const targets = [
  { key: 'favicon',   url: resolve(favicon),      dest: 'public/favicon.ico'           },
  { key: 'apple',     url: resolve(apple),         dest: 'public/apple-touch-icon.png'  },
  { key: 'ogImage',   url: resolve(ogImage),       dest: 'public/og-image.png'          },
  { key: 'twitter',   url: resolve(twitterImage),  dest: 'public/twitter-image.png'     },
].filter(f => f.url)

for (const f of targets) {
  try {
    const res = await fetch(f.url)
    const buf = Buffer.from(await res.arrayBuffer())
    writeFileSync(f.dest, buf)
    console.log(`✓ ${f.key} → ${f.dest} (${buf.length} bytes)`)
  } catch (e) {
    console.log(`✗ ${f.key}: ${e.message}`)
  }
}
