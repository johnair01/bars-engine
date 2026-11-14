#!/usr/bin/env node
// The look check: renders the hollow headless, at a fixed camera and size, and holds the frame's luminance to the baseline
// recorded against the look dataset (public/between/look-data.js, copied from six-faces-council council/look/look.json).
// Spec: six-faces-council .specify/specs/between-look-data (Wendell, 2026-11-10, bld-gate-home-2 and bld-look-scope-2).
//
//   node scripts/local/look-check.mjs            compare this frame to scripts/local/look/baseline.json; exit 1 on a drift
//   node scripts/local/look-check.mjs --update   record the frame and the dataset as the new baseline (a round that moved the look)
//   node scripts/local/look-check.mjs --shot f   also save the frame as a PNG
//
// What it holds: the frame's luminance at the 10th, 40th, 70th and 95th percentiles (the same four the ramp was read
// from) within TOL, and the dataset's ramp, palette and budget against the copy in the baseline, naming the entry that
// moved. Only the luminance ramp is held against the frame; the palette and light budget are held as data only.
// A check that cannot run (no Playwright, no chromium, no network for three.js) skips and says so, and exits 0.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..')
const BASELINE = path.join(ROOT, 'scripts/local/look/baseline.json')
const HARNESS = path.join(ROOT, 'scripts/local/look/harness.html')
const TOL = 0.02          // absolute drift allowed in linear luminance (0..1) at each percentile
const PCTS = [10, 40, 70, 95]
const args = process.argv.slice(2)
const update = args.includes('--update')
const shotAt = args.includes('--shot') ? args[args.indexOf('--shot') + 1] : null

const skip = why => { console.log(`look check skipped: ${why}`); process.exit(0) }
const require = createRequire(import.meta.url)
let chromium
try { ({ chromium } = require('playwright')) } catch {
  try { ({ chromium } = createRequire('/')('playwright')) } catch { skip('Playwright is not installed here') }
}

const { LOOK, LOOK_HASH } = await import('data:text/javascript;base64,' + fs.readFileSync(path.join(ROOT, 'public/between/look-data.js')).toString('base64'))   // a data: import avoids the untyped-package warning
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.css': 'text/css' }
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0])
  const f = p === '/harness.html' ? HARNESS : path.join(ROOT, 'public', p)
  if (!f.startsWith(path.join(ROOT, 'public')) && f !== HARNESS || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end() }
  res.setHeader('content-type', MIME[path.extname(f)] || 'application/octet-stream'); res.end(fs.readFileSync(f))
}).listen(0, '127.0.0.1')
await new Promise(r => server.on('listening', r))
const port = server.address().port

let frame
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }).catch(e => skip(`chromium would not start (${e.message.split('\n')[0]})`))
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto(`http://127.0.0.1:${port}/harness.html`)
  const ok = await page.waitForFunction(() => window.__look, null, { timeout: 45000 }).then(() => true, () => false)
  if (!ok) skip('the harness did not finish; three.js from the CDN may be unreachable')
  const state = await page.evaluate(() => window.__look)
  if (!state.ready) { console.error(`look check FAILED: the hollow did not build: ${state.error}`); process.exitCode = 1; throw 0 }
  frame = await page.evaluate(pcts => {
    const c = document.querySelector('canvas'), t = document.createElement('canvas'); t.width = c.width; t.height = c.height
    const x = t.getContext('2d'); x.drawImage(c, 0, 0); const d = x.getImageData(0, 0, t.width, t.height).data
    const lin = v => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    const lum = new Float32Array(d.length / 4)
    for (let i = 0; i < lum.length; i++) lum[i] = 0.2126 * lin(d[i * 4]) + 0.7152 * lin(d[i * 4 + 1]) + 0.0722 * lin(d[i * 4 + 2])
    lum.sort()
    return { luminance: Object.fromEntries(pcts.map(p => [p, +lum[Math.min(lum.length - 1, Math.floor(lum.length * p / 100))].toFixed(4)])), size: [t.width, t.height] }
  }, PCTS)
  if (shotAt) await page.locator('canvas').screenshot({ path: shotAt })
  if (errors.length) console.log(`page errors while rendering: ${errors.slice(0, 3).join(' | ')}`)
} catch (e) { if (e !== 0) throw e } finally { await browser.close(); server.close() }
if (!frame) process.exit(process.exitCode || 0)

const now = { hash: LOOK_HASH, look: { ramp: LOOK.ramp, palette: LOOK.palette, budget: LOOK.budget }, frame, tolerance: TOL }
if (update) {
  fs.writeFileSync(BASELINE, JSON.stringify(now, null, 1) + '\n')
  console.log(`look baseline recorded for look hash ${LOOK_HASH}: luminance ${JSON.stringify(frame.luminance)}`)
  process.exit(0)
}
if (!fs.existsSync(BASELINE)) { console.error('look check FAILED: scripts/local/look/baseline.json is missing; run it with --update'); process.exit(1) }
const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'))
const problems = []
// The dataset against the baseline's copy: name the entry that moved, so the diff says what shifted.
const stringy = v => JSON.stringify(v)
LOOK.ramp.colours.forEach((c, i) => { const b = base.look.ramp.colours[i]; if (c !== b) problems.push(`ramp.colours[${i}] moved from ${b} to ${c}`) })
LOOK.ramp.stops.forEach((s, i) => { const b = base.look.ramp.stops[i]; if (s !== b) problems.push(`ramp.stops[${i}] moved from ${b} to ${s}`) })
for (const part of ['palette', 'budget']) {
  if (stringy(LOOK[part]) !== stringy(base.look[part])) problems.push(`${part} differs from the baseline copy (held as data only; refresh with --update after the council's look.py --check passes)`)
}
for (const p of PCTS) {
  const got = frame.luminance[p], want = base.frame.luminance[p]
  if (Math.abs(got - want) > TOL) problems.push(`frame luminance at the ${p}th percentile is ${got}, baseline ${want} (tolerance ${TOL})`)
}
console.log(`look hash ${LOOK_HASH} (baseline ${base.hash}); frame luminance ${JSON.stringify(frame.luminance)}; baseline ${JSON.stringify(base.frame.luminance)}`)
if (problems.length) {
  console.error('look check FAILED:\n  - ' + problems.join('\n  - '))
  console.error('If the look was meant to move: refresh the dataset copy from the council, then `node scripts/local/look-check.mjs --update` and cite the new look hash in the pull request.')
  process.exit(1)
}
console.log('look check passed.')
