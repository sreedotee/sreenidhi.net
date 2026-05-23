import puppeteer from 'puppeteer'
const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('http://localhost:5175/', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 1000))
const data = await page.evaluate(() => {
  const hero = document.querySelector('.A-hero').getBoundingClientRect()
  const grid = document.querySelector('.A-hero__grid').getBoundingClientRect()
  const h1   = document.querySelector('.A-hero h1').getBoundingClientRect()
  const ctas = document.querySelector('.A-hero__ctas').getBoundingClientRect()
  return {
    heroTop: Math.round(hero.top), heroBottom: Math.round(hero.bottom), heroHeight: Math.round(hero.height),
    gridTop: Math.round(grid.top), gridBottom: Math.round(grid.bottom), gridHeight: Math.round(grid.height),
    h1Top: Math.round(h1.top), ctasBottom: Math.round(ctas.bottom),
    spaceAbove: Math.round(grid.top - hero.top),
    spaceBelow: Math.round(hero.bottom - grid.bottom),
  }
})
await browser.close()
console.log(JSON.stringify(data, null, 2))
