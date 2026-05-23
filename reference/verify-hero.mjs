import puppeteer from 'puppeteer'
import { mkdirSync } from 'node:fs'
mkdirSync('reference', { recursive: true })

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

const consoleMsgs = []
page.on('console', (m) => consoleMsgs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => consoleMsgs.push(`[error] ${e.message}`))

await page.goto('http://localhost:5175/', { waitUntil: 'networkidle2', timeout: 30000 })
await new Promise((r) => setTimeout(r, 1500))

const checks = await page.evaluate(() => {
  const hero = document.querySelector('.A-hero')
  const canvas = document.querySelector('.A-hero canvas.silk')
  const heroRect = hero?.getBoundingClientRect()

  let canvasInfo = null
  let pixelInfo = null
  if (canvas) {
    canvasInfo = {
      width: canvas.width,
      height: canvas.height,
      cssWidth: canvas.getBoundingClientRect().width,
      cssHeight: canvas.getBoundingClientRect().height,
    }
    // Pull a few pixels via a 2d temp canvas
    const tmp = document.createElement('canvas')
    tmp.width = 200; tmp.height = 200
    const ctx = tmp.getContext('2d')
    ctx.drawImage(canvas, 0, 0, 200, 200)
    const img = ctx.getImageData(0, 0, 200, 200).data
    let rSum = 0, gSum = 0, bSum = 0, n = 0
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0
    for (let i = 0; i < img.length; i += 4) {
      rSum += img[i]; gSum += img[i+1]; bSum += img[i+2]; n++
      if (img[i]   < minR) minR = img[i];   if (img[i]   > maxR) maxR = img[i]
      if (img[i+1] < minG) minG = img[i+1]; if (img[i+1] > maxG) maxG = img[i+1]
      if (img[i+2] < minB) minB = img[i+2]; if (img[i+2] > maxB) maxB = img[i+2]
    }
    pixelInfo = {
      avg: [Math.round(rSum/n), Math.round(gSum/n), Math.round(bSum/n)],
      rangeR: [minR, maxR], rangeG: [minG, maxG], rangeB: [minB, maxB],
      varied: (maxR - minR) > 10 || (maxG - minG) > 10 || (maxB - minB) > 10,
    }
  }

  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    hero: heroRect ? {
      top: Math.round(heroRect.top),
      height: Math.round(heroRect.height),
      width: Math.round(heroRect.width),
    } : null,
    canvas: canvasInfo,
    pixels: pixelInfo,
  }
})

await page.screenshot({ path: 'reference/hero-screenshot.png', clip: { x: 0, y: 0, width: 1440, height: 900 } })
await browser.close()

console.log('=== Console messages ===')
for (const m of consoleMsgs) console.log(' ', m)
console.log('\n=== Checks ===')
console.log(JSON.stringify(checks, null, 2))
