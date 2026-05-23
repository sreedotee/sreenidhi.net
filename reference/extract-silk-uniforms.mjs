import puppeteer from 'puppeteer'
import { writeFileSync, mkdirSync } from 'node:fs'

mkdirSync('reference/silk', { recursive: true })

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1920, height: 1080 })

await page.evaluateOnNewDocument(() => {
  window.__progs = []   // per program: { id, uniforms: { name: latestValue } }
  let progCounter = 0
  const progIdByObj = new WeakMap()

  const patch = (Ctor, label) => {
    if (!Ctor) return
    const proto = Ctor.prototype

    // Track active programs and resolve uniform locations -> names
    const origGetUniformLocation = proto.getUniformLocation
    proto.getUniformLocation = function (program, name) {
      const loc = origGetUniformLocation.call(this, program, name)
      if (loc) {
        loc.__name = name
        loc.__program = program
      }
      return loc
    }

    const recordUniform = (loc, value) => {
      if (!loc || !loc.__program) return
      let pid = progIdByObj.get(loc.__program)
      if (pid === undefined) {
        pid = progCounter++
        progIdByObj.set(loc.__program, pid)
        window.__progs[pid] = { id: pid, api: label, uniforms: {} }
      }
      window.__progs[pid].uniforms[loc.__name] = value
    }

    for (const fn of ['uniform1f', 'uniform2f', 'uniform3f', 'uniform4f',
                      'uniform1i', 'uniform2i', 'uniform3i', 'uniform4i']) {
      if (!proto[fn]) continue
      const orig = proto[fn]
      proto[fn] = function (loc, ...args) {
        recordUniform(loc, args.length === 1 ? args[0] : args)
        return orig.apply(this, [loc, ...args])
      }
    }
    for (const fn of ['uniform1fv', 'uniform2fv', 'uniform3fv', 'uniform4fv',
                      'uniform1iv', 'uniform2iv', 'uniform3iv', 'uniform4iv',
                      'uniformMatrix2fv', 'uniformMatrix3fv', 'uniformMatrix4fv']) {
      if (!proto[fn]) continue
      const orig = proto[fn]
      proto[fn] = function (loc, data) {
        recordUniform(loc, Array.from(data))
        return orig.apply(this, [loc, data])
      }
    }
  }

  patch(window.WebGLRenderingContext, 'webgl')
  patch(window.WebGL2RenderingContext, 'webgl2')
})

await page.goto('https://sreedotee.framer.website/', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5000))

const result = await page.evaluate(() => window.__progs)
await browser.close()

writeFileSync('reference/silk/uniforms.json', JSON.stringify(result, null, 2))
console.log(`Captured uniforms for ${result.length} programs.`)
for (const p of result) {
  const keys = Object.keys(p.uniforms)
  console.log(`  Program ${p.id} (${p.api}): ${keys.length} uniforms`)
}
