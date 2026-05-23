import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://sreedotee.framer.website/', { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5000))

// Scroll through page to force lazy elements to mount
const totalH = await page.evaluate(() => document.body.scrollHeight)
for (let y = 0; y < totalH; y += 600) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y)
  await new Promise((r) => setTimeout(r, 400))
}
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
await new Promise((r) => setTimeout(r, 800))

// Scroll to find sections by their text
const inspect = await page.evaluate(() => {
  const all = [...document.querySelectorAll('body *')]

  // Tools — find a ticker-item to measure
  const tickerItem = all.find((el) => el.classList?.contains('ticker-item'))
  let tools = null
  if (tickerItem) {
    const r = tickerItem.getBoundingClientRect()
    const inner = tickerItem.querySelector('div')
    const innerRect = inner?.getBoundingClientRect()
    const img = tickerItem.querySelector('img')
    const imgRect = img?.getBoundingClientRect()
    const cs = getComputedStyle(tickerItem)
    const innerCs = inner ? getComputedStyle(inner) : null
    const list = tickerItem.parentElement
    const listCs = list ? getComputedStyle(list) : null
    tools = {
      tickerItem: { w: Math.round(r.width), h: Math.round(r.height), display: cs.display, flex: cs.flex },
      tickerItemInner: inner ? { cls: inner.className, w: Math.round(innerRect.width), h: Math.round(innerRect.height), border: innerCs.border, background: innerCs.backgroundColor, padding: innerCs.padding, borderRadius: innerCs.borderRadius } : null,
      img: img ? { w: Math.round(imgRect.width), h: Math.round(imgRect.height), naturalW: img.naturalWidth, naturalH: img.naturalHeight, src: img.src } : null,
      list: list ? { gap: listCs.gap, totalChildren: list.children.length } : null,
    }
  }

  // Testimonials — find by "(03) TESTIMONIALS" eyebrow, then walk to the card sibling
  const testimonialEyebrow = all.find((el) => {
    const t = (el.innerText || '').trim()
    return t === '(03) TESTIMONIALS' && el.children.length === 0
  })
  let testimonial = null
  if (testimonialEyebrow) {
    // Walk up to the section wrapper
    let section = testimonialEyebrow
    for (let i = 0; i < 12; i++) {
      if (!section.parentElement) break
      section = section.parentElement
      const h = section.getBoundingClientRect().height
      if (h > 400 && h < 1200) break
    }
    section.scrollIntoView({ block: 'start', behavior: 'instant' })

    const sectionRect = section.getBoundingClientRect()
    // Find the largest <p> inside the section — that's the quote
    const ps = [...section.querySelectorAll('p')]
    const quoteEl = ps.sort((a, b) => parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize))[0]
    // The card is the largest direct ancestor of the quote with a non-transparent bg
    let card = quoteEl
    for (let i = 0; i < 8; i++) {
      if (!card.parentElement) break
      card = card.parentElement
      const cs = getComputedStyle(card)
      if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') break
    }
    const cardRect = card.getBoundingClientRect()
    const cardCs = getComputedStyle(card)
    const quoteRect = quoteEl.getBoundingClientRect()
    const quoteCs = getComputedStyle(quoteEl)

    testimonial = {
      section: { w: Math.round(sectionRect.width), h: Math.round(sectionRect.height), cls: section.className },
      card: {
        cls: card.className,
        w: Math.round(cardRect.width),
        h: Math.round(cardRect.height),
        background: cardCs.backgroundColor,
        padding: cardCs.padding,
        borderRadius: cardCs.borderRadius,
        maxWidth: cardCs.maxWidth,
      },
      quote: {
        w: Math.round(quoteRect.width),
        h: Math.round(quoteRect.height),
        fontFamily: quoteCs.fontFamily.split(',')[0],
        fontSize: quoteCs.fontSize,
        fontWeight: quoteCs.fontWeight,
        lineHeight: quoteCs.lineHeight,
        letterSpacing: quoteCs.letterSpacing,
        color: quoteCs.color,
        maxWidth: quoteCs.maxWidth,
        text: (quoteEl.innerText || '').slice(0, 200),
      },
    }
  }

  return { tools, testimonial }
})

console.log(JSON.stringify(inspect, null, 2))

await browser.close()
