import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://www.synapserstudio.com/', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5000))

// Capture the rendered DOM
const html = await page.content()
await import('fs').then((fs) => fs.writeFileSync('reference/synapser-rendered.html', html))

// Snapshot scripts loaded
const scripts = await page.$$eval('script[src]', (els) => els.map((e) => e.src))
console.log('SCRIPTS:')
console.log(scripts.join('\n'))

// Capture animation-related rules from stylesheets
const animRules = await page.evaluate(() => {
  const out = []
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules || []) {
        const txt = rule.cssText
        if (/animation|@keyframes|transform|transition/i.test(txt)) {
          out.push(txt.slice(0, 280))
        }
      }
    } catch (e) {}
  }
  return out.slice(0, 60)
})
console.log('\nANIMATION CSS (top 60):')
console.log(animRules.join('\n---\n'))

// Look for marquee / canvas / floating-word containers near the bottom of the page
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await new Promise((r) => setTimeout(r, 3000))
await page.screenshot({ path: 'reference/synapser-footer.png', fullPage: false })

await browser.close()
