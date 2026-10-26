/**
 * The studio boat's browser check (council #412): serves the page /board/studio returns (studioPage, the demo world, no
 * network or database) with public/studio/altitude.js, opens /board/studio?fleet=0&demo=1&auto=1 in Chromium, and waits until
 * one whole loop (run, dock, intake, launch) has played and the clock is back at run, with no page errors. Then it opens
 * the fleet (?fleet=1&demo=1), sails in to one ship and plays that ship's loop the same way. Then the Shaman's loop
 * (?shaman=1&demo=1 at 390 x 844): a tap on a charged room opens its card, Not tonight closes it, and a seeded ember's
 * tap opens the ember's card; and once without the demo flag, a seal's save is checked against validateSave.
 * The real route is not started: it sits behind the owner's sign-in and `next build` needs the deployment's env, so this
 * serves the same HTML the route serves. Skips (exit 0, with a message) when Playwright or its browser is not installed.
 * Run: npx tsx scripts/studio-loop-check.ts
 */
import { createServer } from 'http'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fleetOf } from '../src/lib/studio/fleet'
import { studioPage } from '../src/lib/studio/page'
import { demoShaman } from '../src/lib/studio/shaman'
import { shamanPage } from '../src/lib/studio/shaman-page'
import { validateSave } from '../src/lib/board/save'

type Page = { goto(u: string): Promise<unknown>; evaluate<T>(f: () => T): Promise<T>; waitForTimeout(ms: number): Promise<void>; on(e: string, f: (x: Error) => void): void; mouse: { click(x: number, y: number): Promise<void> }
  addInitScript(f: () => void): Promise<void>; click(sel: string): Promise<void>; isVisible(sel: string): Promise<boolean> }
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
  const shamanHtml = shamanPage(demoShaman())
  const saves: unknown[] = []
  const srv = createServer((q, r) => {
    const [u, qs] = (q.url ?? '').split('?')
    if (u === '/api/board/saves' && q.method === 'POST') {
      let b = ''; q.on('data', c => { b += c }); q.on('end', () => { try { saves.push(JSON.parse(b)) } catch { saves.push(b) } r.writeHead(200, { 'Content-Type': 'application/json' }); r.end('{"ok":true}') })
      return
    }
    if (u === '/board/studio' && new URLSearchParams(qs ?? '').get('shaman') === '1') { r.writeHead(200, { 'Content-Type': 'text/html' }); r.end(shamanHtml) }
    else if (u === '/board/studio') { r.writeHead(200, { 'Content-Type': 'text/html' }); r.end(html) }
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
    await shamanPass(browser, port, errors, saves)
    if (errors.length) throw new Error('page errors:\n' + errors.join('\n'))
    console.log('studio loop check passed')
  } finally { await browser.close(); srv.close() }
}

type ShamanState = { mode: string; phase: string; room: string | null; card: string | null }
type Alt = { AltR9: { shamanBox(s: string): number[] | null; shamanEmbers(): { id: string; x: number; y: number }[] }; __state(): ShamanState }

/** The Shaman's loop: a charged room's tap walks the Shaman there and opens its card; Not tonight closes it; an ember
 * opens its own card; and without the demo flag a seal sends a save the board's contract accepts. */
async function shamanPass(browser: Browser, port: number, errors: string[], saves: unknown[]) {
  const st = (p: Page) => p.evaluate(() => (window as unknown as Alt).__state())
  async function until(p: Page, ok: (s: ShamanState) => boolean, ms: number, what: string) {
    for (let i = 0; i < ms / 100; i++) { const s = await st(p); if (ok(s)) return s; await p.waitForTimeout(100) }
    throw new Error(`shaman: ${what} (state ${JSON.stringify(await st(p))})`)
  }
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } })
  p.on('pageerror', e => errors.push('shaman: ' + e.message))
  await p.addInitScript(() => {
    try { localStorage.setItem('shaman-ember-demo:demo-seeded', JSON.stringify({ id: 'demo-seeded', stage: 'spec', kind: 'position', title: 'A seeded ember', given: 'Stands', savedAt: '2026-10-26T06:00:00.000Z' })) } catch { /* none */ }
  })
  await p.goto(`http://localhost:${port}/board/studio?shaman=1&demo=1`)
  await p.waitForTimeout(600)
  if ((await st(p)).mode !== 'shaman') throw new Error('shaman: the page is not the Shaman loop')
  const box = await p.evaluate(() => (window as unknown as Alt).AltR9.shamanBox('ship'))
  if (!box) throw new Error('shaman: the ship room is not in the frame')
  if (box[0] < 0 || box[2] > 390 || box[1] < 0 || box[3] > 844) throw new Error(`shaman: the ship room is off the phone canvas ${box}`)
  await p.mouse.click((box[0] + box[2]) / 2, (box[1] + box[3]) / 2)
  const opened = await until(p, s => !!s.card, 3200, 'a tap on the ship room opened no card within 3.2 s')
  if (opened.room !== 'ship' || opened.card !== 'demo-loop-look-2') throw new Error(`shaman: the tap opened ${JSON.stringify(opened)}`)
  if (!(await p.isVisible('#card'))) throw new Error('shaman: the card is not on screen')
  console.log('ok /board/studio?shaman=1&demo=1: a tap on the ship room walked the Shaman there and opened ' + opened.card)
  await p.click('#card button.quiet')
  await until(p, s => !s.card, 1500, 'Not tonight did not close the card')
  await p.waitForTimeout(450)
  const em = (await p.evaluate(() => (window as unknown as Alt).AltR9.shamanEmbers())).find(e => e.id === 'demo-seeded')
  if (!em) throw new Error('shaman: the seeded ember is not drawn')
  await p.mouse.click(em.x, em.y)
  await until(p, s => s.card === 'ember:demo-seeded', 1500, 'a tap on the ember opened no card')
  console.log('ok shaman: Not tonight closed the card, and the ember opened its card')
  // without the demo flag (the demo world served as data): the Yes seal sends a save the contract accepts
  const d = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
  d.on('pageerror', e => errors.push('shaman desktop: ' + e.message))
  await d.goto(`http://localhost:${port}/board/studio?shaman=1&room=ship`)
  await d.waitForTimeout(400)
  await d.click('#card button.seal')
  await until(d, s => !s.card, 3000, 'the Yes seal did not fold the card')
  const v = validateSave(saves[saves.length - 1])
  if (!v.ok) throw new Error('shaman: the save is not a board save: ' + JSON.stringify(saves[saves.length - 1]) + ' ' + v.errors.join('; '))
  if (!(await d.evaluate(() => (window as unknown as Alt).AltR9.shamanEmbers())).some(e => e.id === 'demo-loop-look-2')) throw new Error('shaman: no ember after the save')
  console.log('ok shaman: the Yes seal sent ' + JSON.stringify(saves[saves.length - 1]) + ' and left an ember')
}

main().catch(e => { console.error(e instanceof Error ? e.message : e); process.exit(1) })
