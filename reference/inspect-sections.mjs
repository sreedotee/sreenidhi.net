import puppeteer from 'puppeteer'

const VIEWPORTS = [
  { w: 1440, h: 900 },
  { w: 1440, h: 800 },
  { w: 1366, h: 768 },
  { w: 1280, h: 720 },
]

const browser = await puppeteer.launch({ headless: 'new' })

for (const vp of VIEWPORTS) {
  const page = await browser.newPage()
  await page.setViewport({ width: vp.w, height: vp.h })
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 600))

  const report = await page.evaluate(() => {
    const sections = [...document.querySelectorAll('.A-section')]
    return sections.map((s) => {
      const head = s.querySelector('.A-section__head')
      const body = s.querySelector('.A-section__body')
      const sr = s.getBoundingClientRect()
      const hr = head?.getBoundingClientRect()
      const padTop = parseFloat(getComputedStyle(s).paddingTop)
      const padBottom = parseFloat(getComputedStyle(s).paddingBottom)
      const headHeight = hr ? Math.round(hr.height) : 0
      const headMarginBottom = head ? parseFloat(getComputedStyle(head).marginBottom) : 0
      const available = sr.height - padTop - padBottom - headHeight - headMarginBottom
      const bodyScrollHeight = body?.scrollHeight ?? 0
      return {
        id: s.id,
        section: Math.round(sr.height),
        available: Math.round(available),
        body: bodyScrollHeight,
        fill: ((bodyScrollHeight / available) * 100).toFixed(0) + '%',
        overflow: Math.max(0, Math.round(bodyScrollHeight - available)),
      }
    })
  })

  console.log(`\n=== ${vp.w} × ${vp.h} ===`)
  console.table(report)
  await page.close()
}

await browser.close()
