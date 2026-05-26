import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://www.synapserstudio.com/', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 4000))

// Scroll to bottom so the graph renders fully
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await new Promise((r) => setTimeout(r, 4000))
// Scroll partway back so the section is centered
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5))
await new Promise((r) => setTimeout(r, 2000))

// Find SVGs that contain multiple lines (these are likely the graph connectors)
const result = await page.evaluate(() => {
  const allSvgs = [...document.querySelectorAll('svg')]
  const interesting = allSvgs
    .map((svg) => ({
      svg,
      lines: svg.querySelectorAll('line').length,
      paths: svg.querySelectorAll('path').length,
      rect: svg.getBoundingClientRect(),
    }))
    .filter((x) => x.lines > 3 || x.paths > 3)

  function describe(el) {
    const cs = getComputedStyle(el)
    const rect = el.getBoundingClientRect()
    return {
      tag: el.tagName,
      class: typeof el.className === 'string' ? el.className.slice(0, 200) : (el.className?.baseVal?.slice(0, 200) || ''),
      pos: cs.position,
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
      transform: cs.transform === 'none' ? '' : cs.transform,
      animation: cs.animation === 'none' ? '' : cs.animation,
    }
  }

  const out = interesting.slice(0, 3).map(({ svg, lines, paths, rect }) => {
    return {
      svgInfo: describe(svg),
      viewBox: svg.getAttribute('viewBox'),
      lines,
      paths,
      lineSamples: [...svg.querySelectorAll('line')].slice(0, 5).map((l) => ({
        x1: l.getAttribute('x1'),
        y1: l.getAttribute('y1'),
        x2: l.getAttribute('x2'),
        y2: l.getAttribute('y2'),
        style: l.getAttribute('style') || '',
        stroke: getComputedStyle(l).stroke,
        strokeWidth: getComputedStyle(l).strokeWidth,
        strokeDasharray: getComputedStyle(l).strokeDasharray,
        strokeDashoffset: getComputedStyle(l).strokeDashoffset,
      })),
      pathSamples: [...svg.querySelectorAll('path')].slice(0, 3).map((p) => ({
        d: (p.getAttribute('d') || '').slice(0, 200),
        stroke: getComputedStyle(p).stroke,
        strokeWidth: getComputedStyle(p).strokeWidth,
      })),
      parent: svg.parentElement ? describe(svg.parentElement) : null,
      grandparent: svg.parentElement?.parentElement ? describe(svg.parentElement.parentElement) : null,
    }
  })

  // Also look for absolutely-positioned word elements with serif font
  const wordCandidates = [...document.querySelectorAll('div, span, h1, h2, h3, p')]
    .filter((el) => {
      const cs = getComputedStyle(el)
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('')
      if (!own || own.length > 30) return false
      if (cs.position !== 'absolute' && cs.position !== 'fixed') return false
      if (!cs.fontFamily.toLowerCase().includes('newsreader') && !cs.fontFamily.toLowerCase().includes('serif')) return false
      return true
    })
    .slice(0, 20)
    .map((el) => {
      const cs = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return {
        text: [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(''),
        fontSize: cs.fontSize,
        fontFamily: cs.fontFamily.split(',')[0],
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        position: cs.position,
        transform: cs.transform === 'none' ? '' : cs.transform,
        animation: cs.animation === 'none' ? '' : cs.animation,
        style: el.getAttribute('style')?.slice(0, 200) || '',
      }
    })

  return { svgs: out, words: wordCandidates }
})

console.log(JSON.stringify(result, null, 2))
await browser.close()
