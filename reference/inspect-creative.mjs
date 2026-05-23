import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('https://sreedotee.framer.website/', { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5000))

// Locate the Creative Coding heading
const headingHandle = await page.evaluateHandle(() => {
  const candidates = [...document.querySelectorAll('h1, h2, h3, h4, p, div')]
  return candidates.find((el) => (el.innerText || '').trim().toLowerCase() === 'creative coding') || null
})

if (await headingHandle.evaluate((el) => !el)) {
  console.log('Creative Coding heading not found.')
  await browser.close()
  process.exit(0)
}

// Scroll the heading to top of viewport
await page.evaluate((el) => {
  const r = el.getBoundingClientRect()
  window.scrollBy({ top: r.top - 80, behavior: 'instant' })
}, headingHandle)
await new Promise((r) => setTimeout(r, 1500))

await page.screenshot({ path: 'reference/og-creative-rest.png', fullPage: false })

// Find the rows beneath the heading — look for the next container that has multiple link/row children
const tableInfo = await page.evaluate((heading) => {
  // Find the container above that holds the heading + table
  let container = heading
  for (let i = 0; i < 8; i++) {
    if (!container.parentElement) break
    container = container.parentElement
    // If container's height is reasonable (300-1200px), it likely wraps the heading + table
    const h = container.getBoundingClientRect().height
    if (h > 200 && h < 1200) break
  }
  // Within this container, find all elements that look like rows: elements that contain 2+ text children with significant text
  const allRows = [...container.querySelectorAll('div, a, li')]
    .filter((el) => {
      const r = el.getBoundingClientRect()
      const t = (el.innerText || '').trim()
      return r.height > 30 && r.height < 100 && r.width > 800 && t.length > 5 && el.children.length >= 2
    })
    .slice(0, 10)
    .map((el) => ({
      tag: el.tagName.toLowerCase(),
      cls: (el.className?.toString?.() || '').slice(0, 60),
      text: (el.innerText || '').replace(/\s+/g, ' ').slice(0, 120),
      h: Math.round(el.getBoundingClientRect().height),
      y: Math.round(el.getBoundingClientRect().y),
    }))

  return {
    containerCls: container.className,
    containerSize: { w: Math.round(container.getBoundingClientRect().width), h: Math.round(container.getBoundingClientRect().height) },
    candidates: allRows,
  }
}, headingHandle)

console.log('=== TABLE CONTAINER + CANDIDATE ROWS ===')
console.log(JSON.stringify(tableInfo, null, 2))

// Try to find a real row by text content match (Cloud Nine, Horsin', Interactive)
const rowHandle = await page.evaluateHandle(() => {
  const candidates = [...document.querySelectorAll('div, a, li')]
  return candidates.find((el) => {
    const t = (el.innerText || '').trim()
    const r = el.getBoundingClientRect()
    return /Cloud Nine|Horsin|Interactive Globe/i.test(t) && r.height > 30 && r.height < 100 && r.width > 600
  }) || null
})

const rowExists = await rowHandle.evaluate((el) => !!el)
if (rowExists) {
  // Capture computed style BEFORE hover
  const before = await page.evaluate((el) => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return {
      cls: el.className,
      text: el.innerText?.slice(0, 100),
      h: Math.round(r.height),
      bg: cs.backgroundColor,
      color: cs.color,
      transform: cs.transform,
      transition: cs.transition,
      padding: cs.padding,
      letterSpacing: cs.letterSpacing,
    }
  }, rowHandle)
  console.log('\n=== ROW (before hover) ===')
  console.log(JSON.stringify(before, null, 2))

  await page.evaluate((el) => el.scrollIntoView({ block: 'center' }), rowHandle)
  await new Promise((r) => setTimeout(r, 600))
  await rowHandle.hover()
  await new Promise((r) => setTimeout(r, 800))

  // AFTER hover
  const after = await page.evaluate((el) => {
    const cs = getComputedStyle(el)
    return {
      bg: cs.backgroundColor,
      color: cs.color,
      transform: cs.transform,
      padding: cs.padding,
      letterSpacing: cs.letterSpacing,
    }
  }, rowHandle)
  console.log('\n=== ROW (during hover) ===')
  console.log(JSON.stringify(after, null, 2))

  // Look for any newly visible element inside the row (e.g. arrow that wasn't there before)
  const childChanges = await page.evaluate((el) => {
    return [...el.querySelectorAll('*')].slice(0, 30).map((c) => {
      const cs = getComputedStyle(c)
      return {
        tag: c.tagName.toLowerCase(),
        cls: (c.className?.toString?.() || '').slice(0, 60),
        text: (c.innerText || '').slice(0, 40),
        opacity: cs.opacity,
        transform: cs.transform.slice(0, 50),
        display: cs.display,
        visibility: cs.visibility,
      }
    })
  }, rowHandle)
  console.log('\n=== ROW CHILDREN (during hover) ===')
  console.log(JSON.stringify(childChanges, null, 2))

  await page.screenshot({ path: 'reference/og-creative-hover.png', fullPage: false })
}

await browser.close()
