import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://www.josehoudini.es/', { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5000))

const detail = await page.evaluate(() => {
  const get = (el, props = ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color','padding','paddingTop','paddingBottom','paddingLeft','paddingRight','height','width','position','bottom','left','right','zIndex','background','backgroundImage','backdropFilter','webkitBackdropFilter','maskImage','webkitMaskImage','gap','display','justifyContent','alignItems']) => {
    if (!el) return null
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const o = { tag: el.tagName.toLowerCase(), cls: (el.className?.toString?.() || '').slice(0, 100), rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }
    for (const p of props) o[p] = cs[p]
    return o
  }

  const footer = document.querySelector('footer.md\\:fixed') || document.querySelector('footer')
  const yearSpan = footer?.querySelector('span')
  const socialContainer = footer?.querySelectorAll('div')[footer.querySelectorAll('div').length - 1] || footer?.querySelector('.flex')
  const firstSocialA = socialContainer?.querySelector('a')
  const firstSocialSvg = firstSocialA?.querySelector('svg')

  const gradient = document.querySelector('span.gradient')

  // Look for any element with backdrop-filter that overlaps with the bottom 100px of viewport
  const vh = window.innerHeight
  const all = [...document.querySelectorAll('body *')]
  const bottomBlurs = []
  for (const el of all) {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const hasBlur = (cs.backdropFilter !== 'none' && cs.backdropFilter !== '') ||
                    (cs.webkitBackdropFilter !== 'none' && cs.webkitBackdropFilter !== '')
    if (!hasBlur) continue
    if (r.bottom < vh - 100 || r.top > vh) continue
    bottomBlurs.push(get(el))
  }

  return {
    footer: get(footer),
    yearSpan: get(yearSpan),
    socialContainer: get(socialContainer),
    firstSocialA: get(firstSocialA),
    firstSocialSvg: get(firstSocialSvg),
    gradient: get(gradient),
    bottomBlurs,
  }
})

console.log(JSON.stringify(detail, null, 2))
await browser.close()
