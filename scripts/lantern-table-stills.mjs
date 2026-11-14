#!/usr/bin/env node
// Stills of the lantern table (bars-engine .specify/specs/lantern-table, T003 and T010): from the seat, mid-intake, and
// from above, dealt with two moves played. Serves public/ itself, so no database and no Next server are needed; the
// page's GET of /api/lantern/table finds nothing and the table plays as a guest.
//
//   node scripts/lantern-table-stills.mjs <out dir>       writes seat.png and top.png (and stand.png)
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const out = resolve(process.argv[2] || 'lantern-table-stills')
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.css': 'text/css' }
const server = createServer(async (req, res) => {
  const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname))
  try { const body = await readFile(join(root, p)); res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(body) }
  catch { res.writeHead(404); res.end() }
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const port = server.address().port

let chromium
try { ({ chromium } = await import('playwright')) } catch { ({ chromium } = createRequire(import.meta.url)('playwright')) }
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined
const browser = await chromium.launch({ proxy, args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] })
await mkdir(out, { recursive: true })
for (const view of ['seat', 'top', 'stand']) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, ignoreHTTPSErrors: true })
  page.on('pageerror', e => console.log(view, 'page error:', e.message))
  await page.goto(`http://127.0.0.1:${port}/lantern/table/index.html?still=1${view === 'stand' ? '' : '&view=' + view}`)
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 })
  await page.waitForTimeout(1200)
  const cap = await page.textContent('#caption')
  let png
  try { png = await page.screenshot({ timeout: 90000 }) }
  catch { png = Buffer.from((await page.evaluate(() => document.querySelector('canvas').toDataURL('image/png'))).split(',')[1], 'base64') }   // the canvas alone, when the compositor is too slow
  await writeFile(join(out, view + '.png'), png)
  console.log(view, 'written;', 'the table says:', cap)
  await page.close()
}
await browser.close(); server.close()
