import puppeteer from 'puppeteer'
import fs from 'fs'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://www.synapserstudio.com/', { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 4000))

// Scroll to where the giant graph section is. From earlier inspections it's near the bottom.
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5))
await new Promise((r) => setTimeout(r, 2500))

// Find the bounding rect of a known scattered word so we know what part of the page to focus on
const focus = await page.evaluate(() => {
  // Find any one of the constellation words
  const candidates = ['precision', 'innovation', 'craft', 'design', 'technology']
  for (const word of candidates) {
    const el = [...document.querySelectorAll('*')].find((e) => {
      const own = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('')
      return own === word
    })
    if (el) {
      const r = el.getBoundingClientRect()
      return { word, x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }
    }
  }
  return null
})

if (!focus) {
  console.log('Could not find constellation. Screenshotting anyway.')
} else {
  console.log('Anchor word:', focus)
}

// Scroll a bit so the constellation is centered in viewport
if (focus) {
  await page.evaluate((y) => window.scrollBy(0, y - 450), focus.y)
  await new Promise((r) => setTimeout(r, 1200))
}

// Re-find the SYNAPSER center word (giant) and grab its position after scrolling
const centerInfo = await page.evaluate(() => {
  // Look for a very large text element — the giant SYNAPSER
  const all = [...document.querySelectorAll('*')]
  let best = null
  for (const el of all) {
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('')
    if (!own) continue
    const cs = getComputedStyle(el)
    const size = parseFloat(cs.fontSize)
    if (size > 100) {
      const r = el.getBoundingClientRect()
      if (r.top > 0 && r.top < 800) {
        if (!best || size > best.size) best = { text: own, size, x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }
      }
    }
  }
  return best
})
console.log('Giant center:', centerInfo)

// Capture node positions at REST (no mouse interaction yet)
const restPositions = await page.evaluate(() => {
  return [...document.querySelectorAll('div, span')]
    .filter((el) => {
      const cs = getComputedStyle(el)
      if (cs.position !== 'absolute' && cs.position !== 'fixed') return false
      if (!cs.fontFamily.toLowerCase().includes('newsreader')) return false
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('')
      if (!own || own.length > 30) return false
      const r = el.getBoundingClientRect()
      if (r.top < 0 || r.top > 900) return false
      return true
    })
    .map((el) => {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('')
      return {
        text: own,
        x: Math.round(r.left + r.width / 2),
        y: Math.round(r.top + r.height / 2),
        transform: cs.transform,
        size: cs.fontSize,
      }
    })
    .sort((a, b) => a.y - b.y || a.x - b.x)
})

fs.writeFileSync('reference/synapser-rest-positions.json', JSON.stringify(restPositions, null, 2))
console.log(`Captured ${restPositions.length} rest positions`)

await page.screenshot({ path: 'reference/synapser-i-00-rest.png', fullPage: false })

// Now simulate mouse movement and screenshot at each step
// We'll do two motion paths:
//   (a) slow approach from off-screen to the position of a known word, then continue past it
//   (b) sweep horizontally across the center at the word height
const targetWord = restPositions.find((p) => p.text === 'precision') || restPositions[0]
if (!targetWord) throw new Error('No target word found')

console.log('Target word for approach:', targetWord)

const approachPath = []
for (let i = 0; i <= 10; i++) {
  const t = i / 10
  approachPath.push({
    x: 1200 - t * (1200 - targetWord.x - 80),
    y: targetWord.y,
  })
}
// Plus a few frames OVER the word
for (let i = 1; i <= 4; i++) {
  approachPath.push({ x: targetWord.x - 40 + i * 20, y: targetWord.y })
}

// Move mouse and snap a shot at each step
for (let i = 0; i < approachPath.length; i++) {
  const p = approachPath[i]
  await page.mouse.move(p.x, p.y, { steps: 4 })
  await new Promise((r) => setTimeout(r, 350))  // let the easing settle
  // Capture positions at this frame
  const frame = await page.evaluate(() => {
    return [...document.querySelectorAll('div, span')]
      .filter((el) => {
        const cs = getComputedStyle(el)
        if (cs.position !== 'absolute' && cs.position !== 'fixed') return false
        if (!cs.fontFamily.toLowerCase().includes('newsreader')) return false
        const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('')
        return own && own.length < 30
      })
      .map((el) => {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('')
        return { text: own, x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), transform: cs.transform }
      })
  })
  const idx = String(i).padStart(2, '0')
  await page.screenshot({ path: `reference/synapser-i-${idx}-mx${Math.round(p.x)}.png`, fullPage: false })
  fs.writeFileSync(`reference/synapser-i-${idx}-positions.json`, JSON.stringify({ mouseX: p.x, mouseY: p.y, nodes: frame }, null, 2))
}

console.log('Done')
await browser.close()
