/**
 * The studio boat's browser check (council #412): serves the page /board/studio returns (studioPage, the demo world, no
 * network or database) with public/studio/altitude.js, opens /board/studio?fleet=0&demo=1&auto=1 in Chromium, and waits until
 * one whole loop (run, dock, intake, launch) has played and the clock is back at run, with no page errors. Then it opens
 * the fleet (?fleet=1&demo=1), sails in to one ship and plays that ship's loop the same way.
 * The real route is not started: it sits behind the owner's sign-in and `next build` needs the deployment's env, so this
 * serves the same HTML the route serves. Skips (exit 0, with a message) when Playwright or its browser is not installed.
 * Run: npx tsx scripts/studio-loop-check.ts
 */
import { createServer } from 'http'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fleetOf } from '../src/lib/studio/fleet'
import { studioPage } from '../src/lib/studio/page'

type Page = { goto(u: string): Promise<unknown>; evaluate<T>(f: () => T): Promise<T>; waitForTimeout(ms: number): Promise<void>; on(e: string, f: (x: Error) => void): void; mouse: { click(x: number, y: number): Promise<void> } }
type Browser = { newPage(o: object): Promise<Page>; close(): Promise<void> }

async function main() {
  let chromium: { launch(): Promise<Browser> }
  try { chromium = (await import('playwright')).chromium as unknown as typeof chromium } catch {
    console.log('SKIP studio loop check: the playwright package is not installed (npm i --no-save playwright)'); return
  }
  let browser: Browser
  try { browser = await chromium.launch() } catch (e) {
    console.log('SKIP studio loop check: no Chromium for Playwright (npx playwright install --with-deps chromium): ' + (e as Error).message.split('\n')[0]); return
  }
  const html = studioPage(fleetOf({ run: [], earlier: [], runEnds: '' }))
  const js = readFileSync(join(process.cwd(), 'public/studio/altitude.js'))
  const srv = createServer((q, r) => {
    const u = (q.url ?? '').split('?')[0]
    if (u === '/board/studio') { r.writeHead(200, { 'Content-Type': 'text/html' }); r.end(html) }
    else if (u === '/studio/altitude.js') { r.writeHead(200, { 'Content-Type': 'text/javascript' }); r.end(js) }
    else { r.writeHead(404); r.end() }
  })
  await new Promise<void>(res => srv.listen(0, res))
  const port = (srv.address() as { port: number }).port, errors: string[] = []
  const state = (p: Page) => p.evaluate(() => (window as unknown as { __state(): { mode: string; ship: string; phase: string; t: number } }).__state())
  // waits until the loop has gone run -> dock -> intake -> launch -> run; fails after `limit` seconds
  async function oneLoop(p: Page, label: string, limit = 70) {
    const seen: string[] = []
    for (let i = 0; i < limit * 4; i++) {
      const s = await state(p)
      if (seen[seen.length - 1] !== s.phase) seen.push(s.phase)
      if (seen.join(',').includes('run,dock,intake,launch,run')) { console.log(`ok ${label}: ${seen.join(' -> ')}`); return }
      await p.waitForTimeout(250)
    }
    throw new Error(`${label}: the loop did not come round in ${limit}s (saw ${seen.join(' -> ')})`)
  }
  try {
    const p = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    p.on('pageerror', e => errors.push('orrery: ' + e.message))
    await p.goto(`http://localhost:${port}/board/studio?fleet=0&demo=1&auto=1`)
    await oneLoop(p, '/board/studio?fleet=0&demo=1&auto=1')
    const f = await browser.newPage({ viewport: { width: 390, height: 844 } })
    f.on('pageerror', e => errors.push('fleet: ' + e.message))
    await f.goto(`http://localhost:${port}/board/studio?fleet=1&demo=1&auto=1`)
    await f.waitForTimeout(500)
    const box = await f.evaluate(() => (window as unknown as { AltR9: { fleetBox(id: string): number[] } }).AltR9.fleetBox('ember-comet'))
    if (!box) throw new Error('fleet: the Ember Comet is not in the fleet frame')
    await f.mouse.click((box[0] + box[2]) / 2, (box[1] + box[3]) / 2)
    await f.waitForTimeout(1500)
    const s = await state(f)
    if (s.mode !== 'ship' || s.ship !== 'ember-comet') throw new Error(`fleet: a tap on the Ember Comet opened ${s.mode} ${s.ship}`)
    await oneLoop(f, '/board/studio?fleet=1&demo=1&auto=1, Ember Comet')
    if (errors.length) throw new Error('page errors:\n' + errors.join('\n'))
    console.log('studio loop check passed')
  } finally { await browser.close(); srv.close() }
}

main().catch(e => { console.error(e instanceof Error ? e.message : e); process.exit(1) })
