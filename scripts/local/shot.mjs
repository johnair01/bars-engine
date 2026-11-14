#!/usr/bin/env node
// Screenshots of the locally running app, for a look or a still that Wendell can see without a hosted preview.
// Called by `scripts/local/dev.sh shot /path ...`; docs/LOCAL_FIRST_TESTING.md, "Showing Wendell a change".
//
//   OUT=dir        where the pictures go (default .local-dev/shots/<timestamp>/)
//   AS=test-admin  sign the browser in as this seeded player (sets the bars_player_id cookie)
//   WIDTHS=390,1280  viewport widths; phone first (default 390 and 1280)
//   FULL=1         capture the full page, not only the first screen
//   WAIT=1500      extra milliseconds to wait after load (3D scenes, animations)
//
// Uses the Playwright that is pre-installed in Claude cloud sessions (require('playwright')); elsewhere it falls back
// to this repo's node_modules, and says how to install it when neither exists.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const [base, ...paths] = process.argv.slice(2)
if (!base || paths.length === 0) {
  console.error('usage: node scripts/local/shot.mjs http://localhost:PORT /path [/path ...]')
  process.exit(2)
}

const require = createRequire(import.meta.url)
let chromium
try { ({ chromium } = require('playwright')) } catch {
  try { ({ chromium } = createRequire('/')('playwright')) } catch {
    console.error('Playwright is not installed here. On a Mac, open the URL in your browser instead,')
    console.error('or install it once: npx playwright install chromium && npm i -D playwright')
    process.exit(2)
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const out = process.env.OUT || path.join('.local-dev', 'shots', stamp)
fs.mkdirSync(out, { recursive: true })
const widths = (process.env.WIDTHS || '390,1280').split(',').map(Number).filter(Boolean)
const wait = Number(process.env.WAIT || 1500)

const browser = await chromium.launch()
const written = []
let failed = 0
try {
  for (const width of widths) {
    const phone = width < 600
    const ctx = await browser.newContext({
      viewport: { width, height: phone ? 844 : 800 },
      deviceScaleFactor: 2,
      isMobile: phone,
      hasTouch: phone,
    })
    if (process.env.AS) {
      const u = new URL(base)
      await ctx.addCookies([{ name: 'bars_player_id', value: process.env.AS, domain: u.hostname, path: '/' }])
    }
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(String(e)))
    for (const p of paths) {
      const url = new URL(p, base).toString()
      // 'load' first (a first visit compiles the page, which can take a minute), then a short wait for the network to
      // settle; live pages that poll never go fully idle, so that wait is capped.
      const res = await page.goto(url, { waitUntil: 'load', timeout: 180_000 }).catch(e => ({ status: () => 0, err: e }))
      if (res.err) errors.push(String(res.err))
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
      await page.waitForTimeout(wait)
      const name = (p.replace(/^\/+/, '').replace(/[^A-Za-z0-9._-]+/g, '_') || 'home') + `-${width}.png`
      const file = path.join(out, name)
      await page.screenshot({ path: file, fullPage: process.env.FULL === '1' })
      const status = res.status()
      if (status === 0 || status >= 400) failed++
      written.push(file)
      console.log(`${status || 'ERR'}  ${url}  ->  ${file}${errors.length ? `  (page errors: ${errors.length})` : ''}`)
      for (const e of errors.splice(0)) console.log(`      page error: ${e.split('\n')[0]}`)
    }
    await ctx.close()
  }
} finally {
  await browser.close()
}
console.log(`\n${written.length} picture(s) in ${out}`)
process.exit(failed ? 1 : 0)
