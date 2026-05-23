import fs from 'fs'
import path from 'path'
import https from 'https'

const VIDEOS = [
  { hash: 'DVZ23SsUsC8sY0Yx4Xu7QxWNB0', url: 'https://framerusercontent.com/assets/DVZ23SsUsC8sY0Yx4Xu7QxWNB0.mp4', role: 'home hero video' },
  { hash: '4gJr9paJBBnistDr0YXbwCIkLE', url: 'https://framerusercontent.com/assets/4gJr9paJBBnistDr0YXbwCIkLE.mp4', role: 'atelia video' },
  { hash: 'KssuqBJIb5RltpcQSHQmPkisk', url: 'https://framerusercontent.com/assets/KssuqBJIb5RltpcQSHQmPkisk.mp4', role: 'whering video' },
  { hash: 'SOYVCNaI1rPhxYhd7qU7OY504', url: 'https://framerusercontent.com/assets/SOYVCNaI1rPhxYhd7qU7OY504.mp4', role: 'golden group video 1' },
  { hash: 'f5IVVvsBAIzpgENkP4MM98FGkI', url: 'https://framerusercontent.com/assets/f5IVVvsBAIzpgENkP4MM98FGkI.mp4', role: 'golden group video 2' },
]

const outDir = 'public/og-assets'

const download = (url, filepath) =>
  new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath)
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        file.close()
        try { fs.unlinkSync(filepath) } catch {}
        return reject(new Error(`HTTP ${response.statusCode}`))
      }
      response.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
    }).on('error', (err) => {
      file.close()
      try { fs.unlinkSync(filepath) } catch {}
      reject(err)
    })
  })

for (const v of VIDEOS) {
  const filename = `${v.hash}.mp4`
  const filepath = path.join(outDir, filename)
  try {
    await download(v.url, filepath)
    const size = fs.statSync(filepath).size
    console.log(`  ✓ ${filename} (${(size / 1024 / 1024).toFixed(1)} MB) — ${v.role}`)
  } catch (e) {
    console.log(`  ✗ ${filename} — ${e.message}`)
  }
}
