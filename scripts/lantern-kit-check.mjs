#!/usr/bin/env node
// Lantern Hall portable kit: every check prints PASS, FAIL or SKIP, so an environment that cannot look at a frame still
// gets a verdict (brief "Lantern Hall, portable kit", six-faces-council council/callsheets/lantern-hall.md, step 4).
//
//   node scripts/lantern-kit-check.mjs                 pure checks, then the browser checks if Playwright is installed
//   node scripts/lantern-kit-check.mjs --reel <html>   also click through the intake on the v6 reel page
//   node scripts/lantern-kit-check.mjs --stills <dir>  write the turntable and hello-walker stills there
//
// The reel page lives in the private council repo (artifacts/lantern-hall/v6/lantern-hall-v6.html), because it carries
// his personal stories; bars-engine is public. Without --reel the intake click-through looks for a sibling checkout and
// prints SKIP if none is there. Exit code 1 if any check fails.
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null }
const results = []
const say = (verdict, name, detail) => { results.push(verdict); console.log(`${verdict.padEnd(4)} ${name}${detail ? ': ' + detail : ''}`) }

const { runPure } = await import(join(root, 'public/lantern/checks.js'))
for (const r of runPure()) say(r.pass ? 'PASS' : 'FAIL', r.name, r.detail)

let chromium = null
try { ({ chromium } = await import('playwright')) } catch { try { ({ chromium } = await import('@playwright/test')) } catch {} }
if (!chromium) { try { ({ chromium } = createRequire(import.meta.url)('playwright')) } catch {} } // a global install, found through require

const exists = p => stat(p).then(() => true, () => false)
let reel = arg('--reel')
if (!reel) { const guess = resolve(root, '../Six-faces-council/artifacts/lantern-hall/v6/lantern-hall-v6.html'); if (await exists(guess)) reel = guess }

if (!chromium) {
  say('SKIP', 'eight-view turntable renders', 'Playwright is not installed here')
  say('SKIP', 'hello walker still renders', 'Playwright is not installed here')
  say('SKIP', 'intake click-through has no page errors', 'Playwright is not installed here')
} else {
  const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' }
  const mounts = { '/lantern/': join(root, 'public/lantern/') }
  if (reel) mounts['/reel/'] = dirname(resolve(reel)) + '/'
  const server = createServer(async (req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0])
    const m = Object.keys(mounts).find(k => url.startsWith(k))
    if (!m) { res.writeHead(404); return res.end() }
    const file = join(mounts[m], url.slice(m.length))
    if (!file.startsWith(mounts[m])) { res.writeHead(403); return res.end() }
    try { const body = await readFile(file); res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' }); res.end(body) }
    catch { res.writeHead(404); res.end() }
  })
  await new Promise(r => server.listen(0, '127.0.0.1', r))
  const base = `http://127.0.0.1:${server.address().port}`
  const browser = await chromium.launch()
  const stills = arg('--stills')
  if (stills) await mkdir(stills, { recursive: true })

  // A rendered frame is not blank when its pixels vary: count distinct coarse colours in the image.
  const variety = async (page, dataUrl) => page.evaluate(async src => {
    const img = new Image(); img.src = src; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const x = c.getContext('2d'); x.drawImage(img, 0, 0)
    const d = x.getImageData(0, 0, c.width, c.height).data, seen = new Set()
    for (let i = 0; i < d.length; i += 16) seen.add((d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | (d[i + 2] >> 4))
    return seen.size
  }, dataUrl)

  async function pageCheck(name, path, fn) {
    const page = await browser.newPage({ viewport: { width: 900, height: 1200 } })
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
    try {
      await page.goto(base + path, { waitUntil: 'load' })
      const detail = await fn(page, errors)
      if (errors.length) say('FAIL', name, 'page errors: ' + errors.slice(0, 3).join(' | '))
      else say(detail.pass ? 'PASS' : 'FAIL', name, detail.text)
    } catch (e) { say('FAIL', name, e.message.split('\n')[0]) }
    await page.close()
  }

  await pageCheck('eight-view turntable renders', '/lantern/turntable.html', async page => {
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 10000 })
    const url = await page.evaluate(() => window.__frame(0.8))
    const n = await variety(page, url)
    if (stills) await writeFile(join(stills, 'turntable.jpg'), Buffer.from(url.split(',')[1], 'base64'))
    return { pass: n > 40, text: `24 views drawn (3 rows of 8); ${n} distinct colours in the frame` }
  })

  await pageCheck('hello walker still renders', '/lantern/hello.html?still', async page => {
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 10000 })
    const url = await page.evaluate(() => window.__still(1.2))
    const n = await variety(page, url)
    if (stills) await writeFile(join(stills, 'hello-walker.png'), Buffer.from(url.split(',')[1], 'base64'))
    return { pass: n > 12, text: `${n} distinct colours in the still` }
  })

  if (!reel) say('SKIP', 'intake click-through has no page errors', 'no reel page: pass --reel <council>/artifacts/lantern-hall/v6/lantern-hall-v6.html')
  else await pageCheck('intake click-through has no page errors', '/reel/' + reel.split('/').pop(), async page => {
    // Open the intake panel the way a player does (moment 2), then play every step with taps and deal the table.
    await page.evaluate(() => { const b = document.querySelectorAll('#moments button')[1]; b && b.click() })
    await page.waitForSelector('#intakePanel:not([hidden])', { timeout: 5000 })
    let taps = 0
    for (let step = 1; step <= 6; step++) {
      const chips = await page.$$('#igBody .chips button')
      for (const b of chips.slice(0, 3)) { if (await b.isVisible()) { await b.click(); taps++ } }
      if (step < 6) { await page.click('#igNext'); taps++ }
    }
    await page.click('#igDeal'); taps++
    const status = await page.textContent('#igStatus')
    return { pass: /Dealt/.test(status || ''), text: `${taps} taps through goal, toward, now, truth, reservations, tags; status "${(status || '').trim()}"` }
  })

  await browser.close(); server.close()
}

const failed = results.filter(v => v === 'FAIL').length
console.log(failed ? `\n${failed} check(s) failed.` : '\nAll checks that ran passed.')
process.exit(failed ? 1 : 0)
