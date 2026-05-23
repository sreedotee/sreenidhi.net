import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1920, height: 1080 })
await page.goto('https://sreedotee.framer.website/', { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 6000))

// Hide all foreground content so only the silk background renders
await page.evaluate(() => {
  // Find the hero section
  const all = [...document.querySelectorAll('*')]
  for (const el of all) {
    const t = (el.innerText || '').trim()
    // Hide anything containing the headline text or nav
    if (t && (t.includes('Attention is currency') || t.includes('Home') || t.includes('Made in Framer') || t.includes("Hello, I'm"))) {
      // Walk up to find a containing element to hide
      let target = el
      for (let i = 0; i < 5 && target.parentElement; i++) {
        target = target.parentElement
      }
      target.style.visibility = 'hidden'
    }
  }
  // Also try to nuke any nav/header
  document.querySelectorAll('header, nav, .made-in-framer').forEach((el) => el.style.visibility = 'hidden')
})

await new Promise((r) => setTimeout(r, 2000))

// Screenshot just the top portion (hero/silk area)
await page.screenshot({ path: 'reference/og-silk-bare.png', clip: { x: 0, y: 0, width: 1920, height: 1080 } })

await browser.close()
console.log('Captured reference/og-silk-bare.png')
