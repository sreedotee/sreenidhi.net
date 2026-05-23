import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://sreedotee.framer.website/', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 3000))

// Find element containing "TOOLS I USE"
const result = await page.evaluate(() => {
  const all = [...document.querySelectorAll('body *')]
  const eyebrow = all.find((el) => el.textContent?.trim() === '(02) TOOLS I USE' && el.children.length === 0)
  if (!eyebrow) return { error: 'eyebrow not found' }

  // Walk up to find the section wrapper
  let section = eyebrow
  for (let i = 0; i < 12; i++) {
    if (!section.parentElement) break
    section = section.parentElement
    if (section.tagName === 'SECTION' || section.tagName === 'MAIN') break
  }

  // Scroll into view, then capture computed styles + html for the section
  section.scrollIntoView({ block: 'start', behavior: 'instant' })

  const sectionInfo = {
    tag: section.tagName.toLowerCase(),
    rect: (() => { const r = section.getBoundingClientRect(); return { top: Math.round(r.top), height: Math.round(r.height), width: Math.round(r.width) } })(),
    html: section.outerHTML.slice(0, 4000),
  }

  // Find any element with an animation (likely the marquee)
  const animated = [...section.querySelectorAll('*')].filter((el) => {
    const cs = getComputedStyle(el)
    return cs.animationName !== 'none' || cs.transitionProperty !== 'all' && cs.transform !== 'none'
  }).slice(0, 10).map((el) => {
    const cs = getComputedStyle(el)
    return {
      tag: el.tagName.toLowerCase(),
      cls: el.className?.toString().slice(0, 60),
      animationName: cs.animationName,
      animationDuration: cs.animationDuration,
      animationTimingFunction: cs.animationTimingFunction,
      animationIterationCount: cs.animationIterationCount,
      transform: cs.transform.slice(0, 60),
      display: cs.display,
      whiteSpace: cs.whiteSpace,
      width: Math.round(el.getBoundingClientRect().width),
    }
  })

  // List the visible tool labels (text nodes)
  const tools = [...section.querySelectorAll('*')].filter((el) => {
    if (el.children.length > 0) return false
    const t = el.textContent?.trim()
    return t && t.length < 30 && !t.includes('TOOLS') && !t.includes('/')
  }).slice(0, 40).map((el) => ({ text: el.textContent.trim(), tag: el.tagName.toLowerCase() }))

  return { sectionInfo, animated, tools }
})

console.log(JSON.stringify(result, null, 2))

await page.screenshot({ path: 'reference/og-tools-section.png', fullPage: false })

await browser.close()
