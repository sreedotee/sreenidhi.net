import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://sreedotee.framer.website/', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 3000))

const result = await page.evaluate(() => {
  const all = [...document.querySelectorAll('body *')]
  // Find the eyebrow text
  const eyebrow = all.find((el) => {
    const t = el.textContent?.trim()
    return t && /testimonials/i.test(t) && el.children.length === 0
  })
  if (!eyebrow) return { error: 'testimonials eyebrow not found', candidates: all.filter(el => /testim/i.test(el.textContent || '')).slice(0, 5).map(el => ({ tag: el.tagName, text: el.textContent?.trim().slice(0, 60) })) }

  // Walk up to find the section wrapper
  let section = eyebrow
  for (let i = 0; i < 15; i++) {
    if (!section.parentElement) break
    section = section.parentElement
    if (section.tagName === 'SECTION') break
  }

  section.scrollIntoView({ block: 'start', behavior: 'instant' })

  const dump = (el, depth = 0, maxDepth = 4) => {
    if (depth > maxDepth) return null
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).filter(Boolean).join(' ').slice(0, 100)
    return {
      tag: el.tagName.toLowerCase(),
      cls: (el.className?.toString?.() || '').slice(0, 80),
      text: own,
      w: Math.round(r.width),
      h: Math.round(r.height),
      fontFamily: cs.fontFamily.split(',')[0].replace(/"/g, '').slice(0, 30),
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      color: cs.color,
      bg: cs.backgroundColor,
      display: cs.display,
      flexDir: cs.flexDirection,
      children: depth < maxDepth ? [...el.children].slice(0, 10).map(c => dump(c, depth + 1, maxDepth)) : null,
    }
  }

  return { section: dump(section, 0, 5) }
})

console.log(JSON.stringify(result, null, 2))

await page.screenshot({ path: 'reference/og-testimonials.png', fullPage: false })

await browser.close()
