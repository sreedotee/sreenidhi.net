import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://sreedotee.framer.website/', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 3000))

const data = await page.evaluate(() => {
  function pick(text) {
    const all = [...document.querySelectorAll('body *')]
    return all.find((el) => {
      const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ')
      return own.toLowerCase() === text.toLowerCase()
    })
  }
  function describe(el) {
    if (!el) return null
    const cs = getComputedStyle(el)
    const rect = el.getBoundingClientRect()
    return {
      text: el.textContent.trim().slice(0, 40),
      tag: el.tagName,
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      color: cs.color,
      padding: cs.padding,
      width: rect.width,
      height: rect.height,
      bg: cs.backgroundColor,
      border: cs.border,
      borderRadius: cs.borderRadius,
    }
  }
  return {
    about: describe(pick('About')),
    contact: describe(pick('Contact')),
    viewWork: describe(pick('View work')) || describe(pick('View Work')),
    letsTalk: describe(pick("Let's Talk")) || describe(pick("Let's talk")),
  }
})

console.log(JSON.stringify(data, null, 2))
await browser.close()
