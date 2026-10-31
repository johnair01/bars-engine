/**
 * The Between's two-player invite check (Six-faces-council pt1-two-player-check and pt1-cushion-first, playtest 1 of
 * 2026-10-28). The playtest was the invite door's first real second player: the link to joining was unclear, the
 * partner's figure hung on loading, the link got lost later, and the taps meant for the cushion landed on the spark.
 * This check walks the same door with two signed-in players and fails on any of those:
 *   1. the cushion: in a spark room, a tap on the teal cushion with the spark right in front of it sits you down;
 *   2. the link sent: the planter's Invite sheet hands out a link (the clipboard or the phone's share sheet);
 *   3. the link opened on a phone (390 x 844, touch): the doorway in the partner's homeroom offers the room and walks
 *      them through, they ask to join at the spark, the planter welcomes them;
 *   4. both reach the same spark: one garden id, both members, the phase now "between";
 *   5. the partner's figure loads on each screen (a dressed body, not left loading), even when the phone's first fetch of
 *      the figures' robe drops, as a phone on a weak signal drops one;
 *   6. letters from the nook (Six-faces-council hollow-interface rounds 3 and 4): the planter sends a card from the room,
 *      the phone sees it sealed and sends its own from its nook, both open together, and both steps landing keep the story;
 *   7. the link is findable again from the homeroom: the planter's Rooms sheet sends a spark's link again, and the
 *      partner, back in their homeroom without the link, still finds the doorway to the room they were invited to.
 * The real route is not started: it sits behind the sign-in and `next build` needs the deployment's env, so this serves
 * the page the route serves (src/lib/between/page.ts) and an in-memory store that answers /api/between the way
 * src/lib/between/store.ts does, through the same rules (src/lib/between/rules.ts). Each player is a browser context
 * holding its own bars_player_id cookie, as a sign-in leaves it, in a browser of their own. three.js is the version the
 * page's import map names, unpacked from npm and served in place of jsdelivr.
 * Skips (exit 0, with a message) when Playwright or its browser is not installed.
 * Run: npx tsx scripts/between-invite-check.ts            (add --headed to watch, --keep to leave the server up)
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { existsSync, mkdirSync, readFileSync, statSync } from 'fs'
import { execFileSync } from 'child_process'
import { extname, join, normalize } from 'path'
import { randomBytes } from 'crypto'
import { BETWEEN_PAGE } from '../src/lib/between/page'
import { settle, viewGarden } from '../src/lib/between/shared-pick'
import { invitedView, itemFor, mayWrite, merge, parsePath, plantedGarden, plantedHome, roomSummary, type Doc, type Op, type Target, type Who } from '../src/lib/between/rules'

/* ---------- the store, in memory, answering as store.ts does ---------- */
type Row = { data: Doc; at: number }
const players: Record<string, string> = { 'pl-planter': 'Planter', 'pl-partner': 'Partner' }
const gardens = new Map<string, { id: string; startedById: string; inviteToken: string; data: Doc; updatedAt: number }>()
const members = new Map<string, Map<string, number>>()        // garden -> player -> joinedAt
const rows = new Map<string, Row>()                            // "<table>/<garden>/<key>" -> row
const presence = new Map<string, Row>()                        // "<garden>/<player>"
const HERE_MS = 12_000
const newId = () => 'g' + randomBytes(9).toString('hex')
const keyOf = (g: string, t: Target) => t.table === 'garden' ? null
  : t.table === 'shown' ? `shown/${g}/${t.playerId}` : t.table === 'privates' ? `privates/${g}/${t.playerId}/${t.key}` : `${t.table}/${g}/${t.id}`
const inTable = (table: string, g: string) => [...rows.entries()].filter(([k]) => k.startsWith(`${table}/${g}/`)).map(([k, r]) => [k.slice(table.length + g.length + 2), r] as const)

function whoIs(gardenId: string, playerId: string, invite: unknown) {
  const garden = gardens.get(gardenId)
  if (!garden) return null
  const member = !!members.get(gardenId)?.has(playerId)
  const invited = typeof invite === 'string' && invite.length > 8 && invite === garden.inviteToken
  return { garden, who: { playerId, member, invited } as Who }
}
function snapshot(gardenId: string, who: Who) {
  const g = gardens.get(gardenId)!
  const data = g.data
  const peers = [...presence.entries()].filter(([k, r]) => k.startsWith(gardenId + '/') && Date.now() - r.at < HERE_MS)
    .map(([k, r]) => ({ uid: k.split('/')[1], ...r.data })).filter(p => p.uid !== who.playerId)
  const names = { ...players }
  if (!who.member) return { member: false, garden: invitedView(data), items: {}, spirits: {}, daemons: {}, shown: {}, mine: {}, names, peers }
  const obj = (table: string) => Object.fromEntries(inTable(table, gardenId).map(([k, r]) => [k, r.data]))
  return {
    member: true, invite: g.inviteToken, garden: viewGarden(data, who.playerId), names, peers,
    items: Object.fromEntries(inTable('items', gardenId).map(([k, r]) => [k, itemFor(who.playerId, r.data)])),
    spirits: obj('spirits'), daemons: obj('daemons'), shown: obj('shown'),
    mine: Object.fromEntries(inTable('privates', gardenId).filter(([k]) => k.startsWith(who.playerId + '/')).map(([k, r]) => [k.split('/')[1], r.data])),
  }
}
function write(gardenId: string, who: Who, t: Target, op: Op, data: Doc | null) {
  const g = gardens.get(gardenId)
  if (!g) return { ok: false as const, status: 404, error: 'There is no garden here.' }
  const k = keyOf(gardenId, t)
  const cur = t.table === 'garden' ? g.data : (k && rows.get(k)?.data) ?? null
  const verdict = mayWrite(who, g.data, t, op, data, cur)
  if (!verdict.ok) return verdict
  let next = op === 'delete' ? null : op === 'set' ? data! : merge(cur ?? {}, data!)
  if (t.table === 'garden' && next && data && 'letters' in data && next.letters && typeof next.letters === 'object') next = { ...next, letters: settle(next.letters as Doc) }
  if (t.table === 'garden') { g.data = next!; g.updatedAt = Date.now() } else if (next) rows.set(k!, { data: next, at: Date.now() }); else rows.delete(k!)
  if (t.table === 'garden' && data && data.members && typeof data.members === 'object')
    for (const p of Object.keys(data.members as Doc)) if (!members.get(gardenId)!.has(p)) members.get(gardenId)!.set(p, Date.now())
  return { ok: true as const, doc: t.table === 'garden' && next ? viewGarden(next, who.playerId) : next }
}
function plant(playerId: string, data: Doc) {
  const id = newId()
  gardens.set(id, { id, startedById: playerId, inviteToken: randomBytes(18).toString('base64url'), data, updatedAt: Date.now() })
  members.set(id, new Map([[playerId, Date.now()]]))
  return { id }
}
function gardensOf(playerId: string) {
  const mine = [...members.entries()].filter(([, m]) => m.has(playerId)).sort((a, b) => b[1].get(playerId)! - a[1].get(playerId)!).map(([id]) => gardens.get(id)!)
  const homeRow = mine.find(g => g.data.kind === 'home') ?? null
  const rooms = mine.filter(g => g !== homeRow)
  const gardensOut = rooms.map(g => {
    const s = (g.data.setup ?? {}) as Doc
    const its = inTable('items', g.id).map(([id, r]) => ({ id, data: r.data }))
    const hereNow = [...presence.entries()].some(([k, r]) => k.startsWith(g.id + '/') && !k.endsWith('/' + playerId) && Date.now() - r.at < HERE_MS)
    const sum = roomSummary(playerId, g.id, g.data, its, { names: players, hereNow })
    return { ...sum, kind: s.kind ?? null, personName: sum.person ? players[sum.person] ?? null : null, updatedAt: g.updatedAt }
  })
  const h = homeRow ? rows.get(`privates/${homeRow.id}/${playerId}/home`)?.data ?? {} : {}
  const goals = Object.entries((h.goals ?? {}) as Doc).map(([id, x]) => ({ id, ...(x as Doc) }))
  const home = homeRow && { id: homeRow.id, style: homeRow.data.style ?? null, look: h.look ?? null, lastCheckin: h.lastCheckin ?? null, oriented: h.oriented ?? null, goals }
  return { home, gardens: gardensOut }
}
/* Both players have done their first minute (an oriented homeroom), as a returning player has: the invite door is the test. */
for (const p of Object.keys(players)) {
  const { id } = plant(p, plantedHome(p))
  rows.set(`privates/${id}/${p}/home`, { data: { oriented: Date.now() - 864e5 }, at: Date.now() })
}

/* ---------- the server: the page, its files, and /api/between ---------- */
const ROOT = process.cwd()
const TYPES: Record<string, string> = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' }
const send = (r: ServerResponse, status: number, body: unknown) => { r.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); r.end(JSON.stringify(body)) }
const cookieOf = (q: IncomingMessage) => /(?:^|;\s*)bars_player_id=([^;]+)/.exec(q.headers.cookie ?? '')?.[1] ?? null
const bodyOf = (q: IncomingMessage) => new Promise<string>(res => { let b = ''; q.on('data', c => { b += c }); q.on('end', () => res(b)) })
const fileFor = (u: string) => {
  const rel = normalize(decodeURIComponent(u)).replace(/^(\.\.[/\\])+/, '')
  for (const base of [join(ROOT, 'public'), ...(rel.startsWith('/ontology-game/') ? [join(ROOT, 'content')] : [])]) {
    const f = join(base, rel)
    if (f.startsWith(base) && existsSync(f) && statSync(f).isFile()) return f
  }
  return null
}
let dropNext: RegExp | null = null
const dropped: string[] = []
// the page as the route serves it, less its web fonts (not under test, and one more host for the browser to wait on)
const PAGE = BETWEEN_PAGE.replace(/<link rel="(preconnect|stylesheet)" href="https:\/\/fonts\.[^"]*"[^>]*>\n?/g, '')

const open = new Map<object, string>()
const srv = createServer((q, r) => { open.set(r, (cookieOf(q) ?? '-') + ' ' + q.url); r.on('finish', () => open.delete(r)); r.on('close', () => open.delete(r)); handle(q, r).catch(e => { console.log('  server error on ' + q.url + ': ' + (e as Error).message); send(r, 500, { error: String(e) }) }) })
async function handle(q: IncomingMessage, r: ServerResponse) {
  const [u] = (q.url ?? '').split('?')
  const me = cookieOf(q), player = me && players[me] ? me : null
  if (process.env.BETWEEN_CHECK_LOG) console.log('  ' + (me ?? '-') + ' ' + q.method + ' ' + (q.url ?? '').slice(0, 90))
  if (u === '/ontology-game/between') { if (!player) { r.writeHead(302, { Location: '/login' }); r.end(); return } r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(PAGE); return }
  if (u.startsWith('/api/between')) {
    if (!player) return send(r, 401, { error: 'Sign in', code: 'unauthenticated' })
    const raw = q.method === 'POST' ? await bodyOf(q) : ''
    const body = raw ? JSON.parse(raw) : {}
    if (u === '/api/between' && q.method === 'GET') { const has = gardensOf(player); return send(r, 200, { me: player, name: players[player], home: has.home, gardens: has.gardens }) }
    if (u === '/api/between' && q.method === 'POST') {
      const data = body && body.data && typeof body.data === 'object' ? plantedGarden(player, body.data) : null
      if (!data) return send(r, 400, { error: 'Name who the spark is toward' })
      const { id } = plant(player, data); return send(r, 200, { id, doc: data })
    }
    const m = /^\/api\/between\/([^/]+)\/(poll|doc)$/.exec(u)
    if (m && m[2] === 'poll') {
      const found = whoIs(m[1], player, body.invite)
      if (!found) return send(r, 404, { error: 'There is no garden here' })
      if (!found.who.member && !found.who.invited) return send(r, 403, { error: 'Only the two people in this garden can open it' })
      if (body.presence && typeof body.presence === 'object') presence.set(`${m[1]}/${player}`, { data: body.presence, at: Date.now() })
      return send(r, 200, { me: player, ...snapshot(m[1], found.who) })
    }
    if (m && m[2] === 'doc') {
      const t = parsePath(body.path), op = body.op as Op, data = body.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : null
      if (!t || !op || !['set', 'update', 'delete'].includes(op) || (op !== 'delete' && !data)) return send(r, 400, { error: 'Not a garden write', code: 'invalid_argument' })
      const found = whoIs(m[1], player, body.invite)
      if (!found) return send(r, 404, { error: 'There is no garden here', code: 'not_found' })
      const res = write(m[1], found.who, t, op, data)
      if (!res.ok) return send(r, res.status, { error: res.error, code: res.status === 403 ? 'permission_denied' : 'invalid_argument' })
      const doc = !found.who.member && t.table === 'garden' && res.doc ? invitedView(res.doc) : t.table === 'items' && res.doc ? itemFor(player, res.doc) : res.doc
      return send(r, 200, { ok: true, doc })
    }
    return send(r, 404, { error: 'no such call' })
  }
  if (u.startsWith('/api/')) return send(r, 200, { ok: true })
  const f = fileFor(u)
  if (!f) { r.writeHead(404); r.end(); return }
  r.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'application/octet-stream' }); r.end(readFileSync(f))
}

/* ---------- the browser ---------- */
/* three.js, the version the page's import map names, unpacked once from npm (registry.npmjs.org, reachable where the CDN
   may not be) and served in place of jsdelivr, so the check needs no CDN and no proxy. */
function threeHere() {
  const dir = join(ROOT, 'node_modules/.cache/between-invite-check')
  if (!existsSync(join(dir, 'package/build/three.module.js'))) {
    mkdirSync(dir, { recursive: true })
    execFileSync('npm', ['pack', 'three@0.160.0', '--pack-destination', dir, '--silent'], { stdio: 'ignore' })
    execFileSync('tar', ['-xzf', join(dir, 'three-0.160.0.tgz'), '-C', dir])
  }
  return join(dir, 'package')
}
type Page = {
  goto(u: string, o?: object): Promise<unknown>; url(): string
  evaluate<T, A = undefined>(f: (a: A) => T | Promise<T>, a?: A): Promise<T>; waitForFunction<A = undefined>(f: (a: A) => unknown, a?: A, o?: object): Promise<unknown>
  waitForTimeout(ms: number): Promise<void>; on(e: string, f: (x: { message: string; text?(): string; type?(): string }) => void): void
  mouse: { click(x: number, y: number): Promise<void> }; screenshot(o: object): Promise<unknown>; addInitScript(f: () => void): Promise<void>
  context(): Context; close(o?: object): Promise<void>
}
type Context = { newPage(): Promise<Page>; addCookies(c: object[]): Promise<void>; addInitScript(f: (() => void) | { content: string }): Promise<void>; route(u: RegExp, f: (r: { abort(): Promise<void>; continue(): Promise<void>; fulfill(o: object): Promise<void>; request(): { url(): string } }) => unknown): Promise<void> }
type Browser = { newContext(o: object): Promise<Context>; close(): Promise<void> }

const HEADED = process.argv.includes('--headed'), KEEP = process.argv.includes('--keep'), FPS = Math.max(1, Number(process.env.BETWEEN_CHECK_FPS) || 6)
const results: { step: string; ok: boolean; note: string }[] = []
const pass = (step: string, note: string) => { results.push({ step, ok: true, note }); console.log(`ok   ${step}: ${note}`) }
const failStep = (step: string, note: string) => { results.push({ step, ok: false, note }); console.log(`FAIL ${step}: ${note}`) }
async function step(name: string, f: () => Promise<string>) {
  try { pass(name, await f()) } catch (e) { failStep(name, (e as Error).message.split('\n')[0]) }
}

/* The page's clipboard and share sheet, kept so the check can read what was sent. */
function captureSends() {
  const w = window as unknown as { __sent: string[] }
  w.__sent = []
  const keep = (t: string) => { w.__sent.push(t); return Promise.resolve() }
  try { Object.defineProperty(navigator, 'clipboard', { value: { writeText: keep }, configurable: true }) } catch {}
  try { Object.defineProperty(navigator, 'share', { value: (d: { text?: string; url?: string }) => keep(String(d.text || d.url || '')), configurable: true }) } catch {}
}
type B = {
  ids(): { gardenId: string | null; me: string | null; invite: string | null; homeId: string | null; portalTo: { id: string; invite: string | null } | null }
  view(): { g: Doc | null }; meState: { sitting: boolean; seatWant: unknown }; peers: Map<string, { body?: unknown; loading?: boolean }>
  seats(): { id: unknown; x: number; z: number; top: number }[]; setCam(a: number[] | null): void; screenOf(v: unknown): number[]; sheet(): string | null
  anchors(): { mirror: number[] }; scene: { getObjectByName(n: string): unknown }
}
const ready = (p: Page) => p.waitForFunction(() => { const b = (window as unknown as { __between?: B }).__between; const l = document.getElementById('loading'); return !!b && !!l && l.hidden }, undefined, { polling: 250, timeout: 60_000 })
  .catch(async e => { const at = await p.evaluate(() => (document.getElementById('loadMsg')?.textContent ?? '') + ' / ' + (document.getElementById('loadStep')?.textContent ?? '')).catch(() => '?'); throw new Error(`the page did not open (${at}${(p as unknown as { pend?: Set<string> }).pend ? '; waiting on ' + [...(p as unknown as { pend: Set<string> }).pend].join(', ') : ''}): ${(e as Error).message.split('\n')[0]}`) })
/* Waits for the page to have been replaced by a new one that has opened (a walk through the doorway navigates). */
async function reloaded(p: Page, ms: number) {
  for (const end = Date.now() + ms; Date.now() < end; await p.waitForTimeout(500).catch(() => {})) {
    const fresh = await p.evaluate(() => !(window as unknown as { __before?: boolean }).__before && !!(window as unknown as { __between?: B }).__between && !!document.getElementById('loading')?.hidden).catch(() => false)
    if (fresh) return
  }
  throw new Error('the walk through the doorway did not open the room')
}
/* Comes back later: the room's tab is closed and the address opened in a new one (a page held in a room with two
   figures in software WebGL can take longer to unload than a navigation waits). */
async function reopen(p: Page, url: string, watch: (q: Page) => void) {
  const ctx = p.context()
  await p.close({ runBeforeUnload: false } as never)
  const q = await ctx.newPage(); watch(q)
  await q.goto(url, { waitUntil: 'commit' }); await ready(q)
  return q
}
const ids = (p: Page) => p.evaluate(() => (window as unknown as { __between: B }).__between.ids())
const act = (p: Page, a: string, id?: string) => p.evaluate(([a, id]) => {
  const b = document.createElement('button'); b.dataset.act = a; if (id) b.dataset.id = id; b.hidden = true; document.body.appendChild(b); b.click(); b.remove()
}, [a, id ?? ''] as [string, string])
const openSheet = (p: Page, name: string) => p.evaluate(n => {
  const b = document.createElement('button'); b.dataset.open = n; b.hidden = true; document.body.appendChild(b); b.click(); b.remove()
}, name)
const pollNow = (p: Page) => p.evaluate(() => (window as unknown as { __between: { poll(): Promise<void> } }).__between.poll())

async function main() {
  let chromium: { launch(o: object): Promise<Browser> }, devices: Record<string, object>
  try { const pw = await import('playwright'); chromium = pw.chromium as unknown as typeof chromium; devices = pw.devices as unknown as typeof devices } catch {
    console.log('SKIP between invite check: the playwright package is not installed (npm i --no-save playwright)'); return
  }
  let three: string
  try { three = threeHere() } catch (e) { console.log('SKIP between invite check: three@0.160.0 could not be fetched from npm: ' + (e as Error).message.split('\n')[0]); return }
  // each player gets a browser of their own, as two people on two devices have
  let browser: Browser, phone: Browser
  const launch = () => chromium.launch({ headless: !HEADED, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  try { browser = await launch(); phone = await launch() } catch (e) {
    console.log('SKIP between invite check: no Chromium for Playwright (npx playwright install --with-deps chromium): ' + (e as Error).message.split('\n')[0]); return
  }
  await new Promise<void>(res => srv.listen(0, '127.0.0.1', res))
  const base = `http://127.0.0.1:${(srv.address() as { port: number }).port}`
  const errors: string[] = []
  const signIn = async (who: string, opts: object, on: Browser) => {
    const ctx = await on.newContext({ ...opts, baseURL: base })
    await ctx.addCookies([{ name: 'bars_player_id', value: who, url: base }])
    await ctx.route(/^https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\//, r => {
      const f = join(three, r.request().url().split('three@0.160.0/')[1].split('?')[0])
      return existsSync(f) ? r.fulfill({ body: readFileSync(f), contentType: 'text/javascript' }) : r.abort()
    })
    // a dropped fetch, as a phone on a weak signal has: the next model file the check names fails once
    await ctx.route(/\/between\/m\//, r => { const u = r.request().url(); if (dropNext && dropNext.test(u)) { dropNext = null; dropped.push(who + ' ' + u.replace(base, '')); return r.abort() } return r.continue() })
    // tsx names the functions it compiles with a __name helper the page does not have; give the page a no-op one
    await ctx.addInitScript({ content: 'window.__name = (f) => f' })
    await ctx.addInitScript(captureSends)
    // two rooms drawn at once in software WebGL starve each other: each page draws a few frames a second (time still runs at
    // wall-clock pace, so walking, polls and timers are unchanged); BETWEEN_CHECK_FPS=60 draws at full rate
    await ctx.addInitScript({ content: `(() => { const ms = 1000 / ${FPS}; window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), ms) })()` })
    const p = await ctx.newPage()
    watch(who)(p)
    return p
  }
  const watch = (who: string) => (p: Page) => {
    p.on('pageerror', e => errors.push(`${who}: ${e.message}`))
    if (process.env.BETWEEN_CHECK_LOG) {
      const pend = new Set<string>(); const pp = p as unknown as { on(e: string, f: (r: { url(): string }) => void): void }
      pp.on('request', r => pend.add(r.url())); pp.on('requestfinished', r => pend.delete(r.url())); pp.on('requestfailed', r => pend.delete(r.url()))
      ;(p as unknown as { pend: Set<string> }).pend = pend
      pp.on('console', (m: unknown) => console.log('  console ' + who + ': ' + (m as { text(): string }).text().slice(0, 160)))
    }
    return p
  }
  let A = await signIn('pl-planter', { viewport: { width: 1024, height: 700 } }, browser)
  // a phone's size, touch and agent; drawn at one pixel per point, since the software WebGL here draws three times slower at 3x
  let Bp = await signIn('pl-partner', { ...(devices['iPhone 13'] ?? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }), deviceScaleFactor: 1 }, phone)
  let roomId = '', link = ''
  try {
    // the planter plants a spark toward the partner and goes into it
    await A.goto(base + '/ontology-game/between', { waitUntil: 'commit' }); await ready(A)
    roomId = await A.evaluate(async () => {
      const r = await fetch('/api/between', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: { setup: { who: 'Partner', kind: 'Friendship', hopes: '' } } }) })
      return (await r.json()).id as string
    })
    await A.goto(`${base}/ontology-game/between?g=${roomId}&skipHome=1`, { waitUntil: 'commit' }); await ready(A)

    await step('cushion takes the tap ahead of the spark', async () => {
      // stand the camera so the spark is right between it and the teal cushion (seat 0), then tap the cushion
      const at = await A.evaluate(() => {
        const b = (window as unknown as { __between: B }).__between
        const seat = b.seats().find(s => s.id === 0)!, m = b.anchors().mirror
        const sx = m[0], sy = 0.28 + 0.5, sz = m[2], cy = seat.top - 0.1
        const d = [sx - seat.x, sy - cy, sz - seat.z], n = Math.hypot(...d)
        const cam = [sx + d[0] / n * 2.4, sy + d[1] / n * 2.4 + 0.15, sz + d[2] / n * 2.4]
        b.setCam([cam[0], cam[1], cam[2], seat.x, cy, seat.z])
        return { seat: [seat.x, cy, seat.z] }
      })
      await A.waitForTimeout(400)
      // where the cushion is on the screen (a Vector3 made from the camera's own class, since three is not on window)
      const xy = await A.evaluate(s => { const b = (window as unknown as { __between: B & { camera: { position: { constructor: new (x: number, y: number, z: number) => unknown } } } }).__between; const V = b.camera.position.constructor; return b.screenOf(new V(s[0], s[1], s[2])) }, at.seat)
      await A.mouse.click(xy[0], xy[1])
      await A.evaluate(() => (window as unknown as { __between: B }).__between.setCam(null))
      await A.waitForFunction(() => { const b = (window as unknown as { __between: B }).__between; return b.meState.sitting && b.meState.seatWant === 0 }, undefined, { polling: 250, timeout: 15_000 })
      return 'a tap on the cushion through the spark walked the planter to the teal cushion and sat them down'
    })
    await A.evaluate(() => (window as unknown as { __between: { standUp(): void } }).__between.standUp())

    await step('the link is sent from the Invite sheet', async () => {
      await openSheet(A, 'invite')
      await A.waitForFunction(() => !!document.querySelector('[data-act="joinCopy"],[data-act="joinShare"]'), undefined, { polling: 250, timeout: 10_000 })
      await A.evaluate(() => (document.querySelector('[data-act="joinShare"]') || document.querySelector('[data-act="joinCopy"]') as HTMLElement as HTMLElement).click())
      await A.waitForFunction(() => (window as unknown as { __sent: string[] }).__sent.length > 0, undefined, { polling: 250, timeout: 5_000 })
      const sent = await A.evaluate(() => (window as unknown as { __sent: string[] }).__sent.slice(-1)[0])
      const m = /(https?:\/\/\S+invite=\S+)/.exec(sent)
      if (!m) throw new Error('the sheet sent no link: ' + sent)
      link = m[1]
      return 'sent ' + link.replace(base, '').replace(/invite=[^&]+/, 'invite=…')
    })

    await step('the partner opens the link on a phone and the doorway offers the room', async () => {
      if (!link) throw new Error('no link to open')
      await Bp.goto(link, { waitUntil: 'commit' }); await ready(Bp)
      await Bp.waitForFunction(id => { const p = (window as unknown as { __between: B }).__between.ids().portalTo; return !!p && p.id === id }, roomId, { polling: 250, timeout: 10_000 })
        .catch(async () => { throw new Error('the phone has no doorway to the room: ' + JSON.stringify(await ids(Bp))) })
      await openSheet(Bp, 'destinations')
      const offered = await Bp.evaluate(() => !!document.querySelector('#sheetInner [data-act="through"]'))
      if (!offered) throw new Error('the doorway sheet has no Enter for the room')
      return 'the phone woke in its homeroom, and the doorway names the room it was invited to'
    })

    await step('the partner walks through and asks to join at the spark', async () => {
      // the phone's address already names the room (the link), so the walk is known by a new page loading, not by the URL
      await Bp.evaluate(() => { (window as unknown as { __before: boolean }).__before = true })
      dropNext = /\/between\/m\/dusk\/robe\.glb/ // in the room, the phone's first fetch of the figures' robe drops (the playtest's hung figure)
      await act(Bp, 'through')
      await reloaded(Bp, 45_000)
      await Bp.waitForFunction(() => { const b = (window as unknown as { __between: B }).__between; const g = b.view().g; return !!g && g.phase === 'spark' }, undefined, { polling: 250, timeout: 15_000 })
      await act(Bp, 'join')
      await A.waitForTimeout(300); await pollNow(A)
      await A.waitForFunction(() => { const g = (window as unknown as { __between: B }).__between.view().g as { joinRequest?: { uid: string } } | null; return !!g && !!g.joinRequest && g.joinRequest.uid === 'pl-partner' }, undefined, { polling: 250, timeout: 15_000 })
      return 'the phone opened the spark as a guest and its Ask to join reached the planter'
    })

    await step('the planter welcomes them and both reach the same spark', async () => {
      await openSheet(A, 'welcome')
      await act(A, 'welcomeKeep')
      await A.waitForFunction(() => { const g = (window as unknown as { __between: B }).__between.view().g; return !!g && g.phase === 'between' }, undefined, { polling: 250, timeout: 15_000 })
      await pollNow(Bp)
      await Bp.waitForFunction(() => { const g = (window as unknown as { __between: B }).__between.view().g as { phase?: string; members?: Doc } | null; return !!g && g.phase === 'between' && !!g.members && 'pl-partner' in g.members }, undefined, { polling: 250, timeout: 20_000 })
      const [a, b] = [await ids(A), await ids(Bp)]
      if (a.gardenId !== roomId || b.gardenId !== roomId) throw new Error(`different rooms: planter ${a.gardenId}, partner ${b.gardenId}`)
      return `both screens hold room ${roomId.slice(0, 8)}…, both members, the Between begun`
    })

    await step("the partner's figure loads on each screen", async () => {
      const loaded = (p: Page, other: string) => p.waitForFunction(o => { const e = (window as unknown as { __between: B }).__between.peers.get(o); return !!e && !!e.body && !e.loading }, other, { polling: 250, timeout: 45_000 })
      await Promise.all([pollNow(A), pollNow(Bp)])
      await loaded(A, 'pl-partner'); await loaded(Bp, 'pl-planter')
      return "the planter sees the partner's dressed figure, and the phone sees the planter's" + (dropped.length ? ', after the phone\'s dropped fetch of ' + dropped.map(d => d.split(' ')[1]).join(', ') : '')
    })

    await step('letters from the nook: sealed until both are in, the obstacle drawn, both steps land and the story is kept', async () => {
      type LT = { state(): Doc | null; send(card: string): Promise<void>; step(i: number): Promise<void>; pollNook(): Promise<void> }
      const lt = (p: Page) => p.waitForFunction(() => !!(window as unknown as { __between: { letters?: LT } }).__between.letters, undefined, { polling: 250, timeout: 15_000 })
      const state = (p: Page) => p.evaluate(() => (window as unknown as { __between: { letters: LT } }).__between.letters.state())
      const until = (p: Page, what: string, f: string) => p.waitForFunction(new Function('return (function(){ const s = window.__between.letters.state(); return !!s && (' + f + ') })()') as () => boolean, undefined, { polling: 250, timeout: 20_000 })
        .catch(async () => { throw new Error(what + ' did not happen; the page holds ' + JSON.stringify(await state(p).catch(e => String(e))).slice(0, 400)) })
      // the planter opens the letters from the room; a garden of two opens real letters, not the rehearsal
      A = await reopen(A, `${base}/ontology-game/between?g=${roomId}&skipHome=1&pick=a6`, watch('pl-planter')); await lt(A)
      await until(A, 'the letters opening', "!s.local && s.enc === 'a6'")
      await A.evaluate(() => (window as unknown as { __between: { letters: LT } }).__between.letters.send('WAKE-DA-REGENT'))
      // the phone, in its nook, sees only that a letter is sealed (the server keeps the card) and sends its own from there
      await pollNow(Bp); await lt(Bp)
      const sealed = await Bp.evaluate(async g => { const r = await fetch('/api/between/' + g + '/poll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); const j = await r.json(); return j.garden.letters.a6.sent['pl-planter'] }, roomId)
      if (!sealed || sealed.card || !sealed.sealed) throw new Error('the partner could read a letter before both were in: ' + JSON.stringify(sealed))
      await Bp.evaluate(() => (window as unknown as { __between: { letters: LT } }).__between.letters.pollNook())
      await until(Bp, "the phone's nook finding the letters", "s.enc === 'a6' && !s.mine")
      await Bp.evaluate(() => (window as unknown as { __between: { letters: LT } }).__between.letters.send('WAKE-DA-DIPLOMAT'))
      await pollNow(A); await until(A, 'both letters opening together', "s.both && s.theirs === 'WAKE-DA-DIPLOMAT'")
      // a card sent stays in the Between: the phone cannot send another at A6
      const again = await Bp.evaluate(async g => (await fetch('/api/between/' + g + '/doc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: 'garden/main', op: 'update', data: { letters: { a6: { sent: { 'pl-partner': { card: 'WAKE-GR-SAGE', at: Date.now() } } } } } }) })).status, roomId)
      if (again !== 409) throw new Error('a second letter answered ' + again + ', not 409')
      // both steps: the planter stands on the path, the phone knocks twice; the server keeps the story
      await A.evaluate(() => (window as unknown as { __between: { letters: LT } }).__between.letters.step(0))
      await Bp.evaluate(() => (window as unknown as { __between: { letters: LT } }).__between.letters.pollNook())
      await Bp.evaluate(() => (window as unknown as { __between: { letters: LT } }).__between.letters.step(0))
      await pollNow(A); await until(A, 'the obstacle overcome on the planter\'s screen', "s.overcome && s.story === \"The two on the path, the knock at Pip's door.\"")
      const shots = process.env.BETWEEN_CHECK_SHOTS
      if (shots) await A.screenshot({ path: join(shots, 'letters-overcome-planter.png'), timeout: 90_000 }).catch(e => console.log('  shot: ' + (e as Error).message.split('\n')[0]))
      return 'the planter sent Which Fight Is Yours from the room, the phone saw it sealed and sent Who\'s at Risk from its nook, both opened together, a second letter was refused (409), and both steps landing kept "The two on the path, the knock at Pip\'s door."'
    })

    await step('the link is findable again from the homeroom', async () => {
      // the planter: a second spark, waiting, and its link sent again from the homeroom's Rooms sheet
      const second = await A.evaluate(async () => {
        const r = await fetch('/api/between', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: { setup: { who: 'Someone else', kind: 'Friendship', hopes: '' } } }) })
        return (await r.json()).id as string
      })
      A = await reopen(A, base + '/ontology-game/between', watch('pl-planter'))
      await openSheet(A, 'rooms')
      const again = await A.evaluate(id => !!document.querySelector(`#sheetInner [data-act="sparkAgain"][data-id="${id}"]`), second)
      if (!again) throw new Error("the homeroom's Rooms sheet has no Send the link again for a waiting spark")
      await act(A, 'sparkAgain', second)
      await A.waitForFunction(() => (window as unknown as { __sent: string[] }).__sent.length > 0, undefined, { polling: 250, timeout: 5_000 })
      const sent = await A.evaluate(() => (window as unknown as { __sent: string[] }).__sent[0])
      if (!sent.includes('g=' + second) || !/invite=/.test(sent)) throw new Error('the link sent again is not the spark\'s: ' + sent)
      // the partner, invited to that spark, comes back to the homeroom later with no link in hand: the doorway still offers it
      const partnerLink = /(https?:\/\/\S+)/.exec(sent)![1].replace(/^https?:\/\/[^/]+/, base)
      Bp = await reopen(Bp, partnerLink, watch('pl-partner'))
      Bp = await reopen(Bp, base + '/ontology-game/between', watch('pl-partner'))
      const kept = await Bp.evaluate(() => (window as unknown as { __between: B }).__between.ids().portalTo)
      if (!kept || kept.id !== second) throw new Error('back in the homeroom without the link, the doorway forgot the invitation')
      return "the planter's Rooms sheet sent the spark's link again, and the partner's doorway kept the invitation without the link"
    })
  } finally {
    const shot = process.env.BETWEEN_CHECK_SHOTS
    if (shot) { await A.screenshot({ path: join(shot, 'planter.png') }).catch(() => {}); await Bp.screenshot({ path: join(shot, 'partner.png') }).catch(() => {}) }
    if (!KEEP) { await browser.close(); await phone.close(); srv.close() }
  }
  if (process.env.BETWEEN_CHECK_LOG) console.log('  unanswered at the end: ' + [...open.values()].join(', '))
  const real = errors.filter(e => !/fonts\.g|ERR_|Failed to fetch/.test(e))
  if (real.length) failStep('no page errors', real.slice(0, 4).join(' | '))
  const failed = results.filter(r => !r.ok)
  console.log(failed.length ? `\n${failed.length} of ${results.length} steps failed` : `\nall ${results.length} steps passed`)
  if (failed.length) process.exitCode = 1
}

main().catch(e => { console.error(e); process.exitCode = 1; srv.close() })
