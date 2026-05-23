import puppeteer from 'puppeteer'
import { writeFileSync, mkdirSync } from 'node:fs'

mkdirSync('reference/silk', { recursive: true })

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1920, height: 1080 })

// Hook WebGL BEFORE any page script runs.
// Capture every shader source + every program link (so we can pair vs + fs).
await page.evaluateOnNewDocument(() => {
  window.__capturedShaders = []
  window.__capturedPrograms = []

  const patch = (Ctor, label) => {
    if (!Ctor) return
    const proto = Ctor.prototype

    const origShaderSource = proto.shaderSource
    proto.shaderSource = function (shader, source) {
      const type = this.getShaderParameter(shader, this.SHADER_TYPE)
      const kind = type === this.VERTEX_SHADER ? 'vertex' : 'fragment'
      const id = window.__capturedShaders.length
      window.__capturedShaders.push({ id, api: label, kind, source })
      shader.__capturedId = id
      return origShaderSource.call(this, shader, source)
    }

    const origAttachShader = proto.attachShader
    proto.attachShader = function (program, shader) {
      program.__attachedIds = program.__attachedIds || []
      if (shader && shader.__capturedId !== undefined) {
        program.__attachedIds.push(shader.__capturedId)
      }
      return origAttachShader.call(this, program, shader)
    }

    const origLinkProgram = proto.linkProgram
    proto.linkProgram = function (program) {
      const ret = origLinkProgram.call(this, program)
      window.__capturedPrograms.push({
        api: label,
        shaderIds: program.__attachedIds || [],
      })
      return ret
    }
  }

  patch(window.WebGLRenderingContext, 'webgl')
  patch(window.WebGL2RenderingContext, 'webgl2')
})

await page.goto('https://sreedotee.framer.website/', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 4000))

const result = await page.evaluate(() => ({
  shaders: window.__capturedShaders || [],
  programs: window.__capturedPrograms || [],
}))

await browser.close()

// Write raw dump
writeFileSync('reference/silk/dump.json', JSON.stringify(result, null, 2))

// Write each shader as its own .glsl for easy reading
for (const s of result.shaders) {
  const ext = s.kind === 'vertex' ? 'vert' : 'frag'
  writeFileSync(`reference/silk/shader-${String(s.id).padStart(2, '0')}-${s.kind}.${ext}`, s.source)
}

// Build paired-program summaries
const programSummary = result.programs.map((p, i) => {
  const lines = [`# Program ${i} (${p.api})`]
  for (const sid of p.shaderIds) {
    const s = result.shaders[sid]
    if (!s) continue
    lines.push(`\n## Shader ${sid} — ${s.kind}\n`)
    lines.push('```glsl')
    lines.push(s.source)
    lines.push('```')
  }
  return lines.join('\n')
}).join('\n\n---\n\n')

writeFileSync('reference/silk/programs.md', programSummary)

console.log(`Captured ${result.shaders.length} shaders across ${result.programs.length} programs.`)
console.log('Written to reference/silk/')
