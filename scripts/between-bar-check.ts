/**
 * A bar left on the Between's low table (Six-faces-council friendship-between, his B on bb-look-1, 2026-11-04).
 * Two signed-in players share a Between (phase "between"). The check walks the act and fails if any of it breaks:
 *   1. the leaver opens "Leave a bar", writes a title and lines, lays it on the table: one item of kind `bar`;
 *   2. the finder's screen draws that bar on the low table, glowing (a light column), and the leaver's draws it plain-lit;
 *   3. the finder picks it up and reads it: the bar is marked found for both, and the glow column goes;
 *   4. the finder cannot rewrite or take back the bar (the rules refuse), and the leaver cannot take back a read bar;
 *   5. five bars lie in a fan; a sixth gathers them into one Bar deck, and the deck opens a list of all six.
 * Same harness as scripts/between-invite-check.ts (an in-memory store answering through the real rules). Skips (exit 0)
 * when Playwright or its browser is not installed. Pictures: BETWEEN_CHECK_SHOTS=<dir>.
 * Run: npx tsx scripts/between-bar-check.ts
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

/* A shared Between of two, already begun (phase "between"). */
const ROOM = (() => {
  const base = plantedGarden('pl-planter', { setup: { who: 'Partner', kind: 'Friendship', hopes: '' } })!
  const { id } = plant('pl-planter', { ...base, phase: 'between', betweenSince: Date.now() - 864e5, members: { 'pl-planter': { joinedAt: 1 }, 'pl-partner': { joinedAt: 2 } } })
  members.get(id)!.set('pl-partner', Date.now())
  return id
})()

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
  seats(): { id: unknown; x: number; z: number; top: number; yaw: number }[]; setCam(a: number[] | null): void; screenOf(v: unknown): number[]; sheet(): string | null
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
/* Taps a seat on the screen as a thumb would: the camera looks down on it from above (so a figure standing near it is
   not in the way), and the tap lands where it shows. */
async function tapSeat(p: Page, id: number) {
  const at = await p.evaluate(i => {
    const b = (window as unknown as { __between: B }).__between
    const seat = b.seats().find(s => s.id === i)!, cy = seat.top - 0.1
    b.setCam([seat.x + Math.sin(seat.yaw) * 0.4, cy + 2.6, seat.z + Math.cos(seat.yaw) * 0.4, seat.x, cy, seat.z])
    return [seat.x, cy, seat.z]
  }, id)
  await p.waitForTimeout(400)
  const xy = await p.evaluate(s => { const b = (window as unknown as { __between: B & { camera: { position: { constructor: new (x: number, y: number, z: number) => unknown } } } }).__between; const V = b.camera.position.constructor; return b.screenOf(new V(s[0], s[1], s[2])) }, at)
  await p.mouse.click(xy[0], xy[1])
  await p.evaluate(() => (window as unknown as { __between: B }).__between.setCam(null))
}
const sittingOn = (p: Page, id: number, ms = 60_000) => p.waitForFunction(i => { const b = (window as unknown as { __between: B }).__between; return b.meState.sitting && b.meState.seatWant === i }, id, { polling: 250, timeout: ms })
const pollNow = (p: Page) => p.evaluate(() => (window as unknown as { __between: { poll(): Promise<void> } }).__between.poll())

async function main() {
  let chromium: { launch(o: object): Promise<Browser> }, devices: Record<string, object>
  try { const pw = await import('playwright'); chromium = pw.chromium as unknown as typeof chromium; devices = pw.devices as unknown as typeof devices } catch {
    console.log('SKIP between bar check: the playwright package is not installed (npm i --no-save playwright)'); return
  }
  let three: string
  try { three = threeHere() } catch (e) { console.log('SKIP between bar check: three@0.160.0 could not be fetched from npm: ' + (e as Error).message.split('\n')[0]); return }
  let browser: Browser, phone: Browser
  const launch = () => chromium.launch({ headless: !HEADED, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  try { browser = await launch(); phone = await launch() } catch (e) {
    console.log('SKIP between bar check: no Chromium for Playwright: ' + (e as Error).message.split('\n')[0]); return
  }
  await new Promise<void>(res => srv.listen(0, '127.0.0.1', res))
  const base = `http://127.0.0.1:${(srv.address() as { port: number }).port}`
  const errors: string[] = []
  const shots = process.env.BETWEEN_CHECK_SHOTS
  const signIn = async (who: string, opts: object, on: Browser) => {
    const ctx = await on.newContext({ ...opts, baseURL: base })
    await ctx.addCookies([{ name: 'bars_player_id', value: who, url: base }])
    await ctx.route(/^https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\//, r => {
      const f = join(three, r.request().url().split('three@0.160.0/')[1].split('?')[0])
      return existsSync(f) ? r.fulfill({ body: readFileSync(f), contentType: 'text/javascript' }) : r.abort()
    })
    await ctx.addInitScript({ content: 'window.__name = (f) => f' })
    await ctx.addInitScript({ content: `(() => { const ms = 1000 / ${FPS}; window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), ms) })()` })
    const p = await ctx.newPage()
    p.on('pageerror', e => errors.push(`${who}: ${e.message}`))
    return p
  }
  const A = await signIn('pl-planter', { viewport: { width: 1024, height: 700 } }, browser)
  const Bp = await signIn('pl-partner', { ...(devices['iPhone 13'] ?? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }), deviceScaleFactor: 1 }, phone)
  type Th = { kind: string; group: { children: { geometry?: { type: string }; material?: { opacity?: number } }[] }; item?: Doc }
  const bars = (p: Page) => p.evaluate(() => {
    const T = (window as unknown as { __between: { things: Map<string, Th> } }).__between.things
    return [...T.entries()].filter(([, t]) => t.kind === 'bar').map(([id, t]) => {
      let col = false; const walk = (o: unknown) => { const x = o as { geometry?: { type: string }; children?: unknown[] }; if (x.geometry && x.geometry.type === 'CylinderGeometry') col = true; (x.children || []).forEach(walk) }
      walk(t.group); return { id, status: (t.item as Doc | undefined)?.status as string, column: col }
    })
  })
  const shot = async (p: Page, name: string) => { if (shots) { mkdirSync(shots, { recursive: true }); await p.waitForTimeout(1500); await p.screenshot({ path: join(shots, name + '.png'), timeout: 120_000 }).catch(e => console.log('  (no still: ' + (e as Error).message.split('\n')[0] + ')')) } }
  const lookAtTable = (p: Page) => p.evaluate(() => (window as unknown as { __between: B }).__between.setCam([0, 1.55, -0.55, 0, 0.3, 1.3]))
  try {
    for (const [p, who] of [[A, 'pl-planter'], [Bp, 'pl-partner']] as [Page, string][]) {
      await p.goto(`${base}/ontology-game/between?g=${ROOM}&skipHome=1`, { waitUntil: 'commit' }); await ready(p)
      void who
    }
    await step('the leaver lays a bar on the table', async () => {
      await openSheet(A, 'barleave')
      await A.waitForFunction(() => !!document.getElementById('bTitle'), undefined, { polling: 200, timeout: 10_000 })
      await A.evaluate(() => {
        (document.getElementById('bTitle') as HTMLInputElement).value = 'What I saw by the river';
        (document.getElementById('bLines') as HTMLTextAreaElement).value = 'A heron stood still for a long time.\nI thought of you.'
        ;(document.getElementById('barForm') as HTMLFormElement).requestSubmit()
      })
      await A.waitForFunction(() => [...(window as unknown as { __between: { view(): { items: Map<string, Doc> } } }).__between.view().items.values()].some(i => i.kind === 'bar'), undefined, { polling: 250, timeout: 15_000 })
      const stored = [...rows.entries()].filter(([k]) => k.startsWith(`items/${ROOM}/`)).map(([, r]) => r.data).filter(d => d.kind === 'bar')
      if (stored.length !== 1 || stored[0].status !== 'left' || stored[0].by !== 'pl-planter') throw new Error('stored: ' + JSON.stringify(stored))
      return 'one bar, status left, by the leaver'
    })
    await step('the finder sees it glowing on the table; the leaver sees it lit but no column', async () => {
      await pollNow(Bp); await Bp.waitForFunction(() => [...(window as unknown as { __between: { things: Map<string, Th> } }).__between.things.values()].some(t => t.kind === 'bar'), undefined, { polling: 250, timeout: 20_000 })
      const b = await bars(Bp), a = await bars(A)
      if (b.length !== 1 || !b[0].column) throw new Error('finder: ' + JSON.stringify(b))
      if (a.length !== 1 || a[0].column) throw new Error('leaver: ' + JSON.stringify(a))
      await lookAtTable(Bp); await lookAtTable(A); await shot(Bp, 'finder-arrives-phone'); await shot(A, 'leaver-desktop')
      return 'finder column on, leaver column off'
    })
    await step('the finder cannot rewrite or take it back', async () => {
      const id = (await bars(Bp))[0].id
      const r = await Bp.evaluate(async id => {
        const out: number[] = []
        for (const [op, data] of [['update', { title: 'mine' }], ['delete', null]] as [string, object | null][]) {
          const res = await fetch(`/api/between/${(window as unknown as { __between: { ids(): { gardenId: string } } }).__between.ids().gardenId}/doc`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: 'items/' + id, op, data: data ?? undefined }) })
          out.push(res.status)
        }
        return out
      }, id)
      if (!r.every(s => s >= 400)) throw new Error('allowed: ' + r.join(','))
      return 'refused ' + r.join(', ')
    })
    await step('the finder reads it: found for both, the column goes', async () => {
      const id = (await bars(Bp))[0].id
      await Bp.evaluate(i => (window as unknown as { __between: { openSheet(n: string, a: string): void } }).__between.openSheet('bar', i), id)
      await Bp.waitForFunction(() => /A heron stood still/.test(document.getElementById('sheet')?.textContent ?? ''), undefined, { polling: 200, timeout: 10_000 })
      await shot(Bp, 'finder-reads-phone')
      await pollNow(Bp); await pollNow(A)
      await A.waitForFunction(() => [...(window as unknown as { __between: { view(): { items: Map<string, Doc> } } }).__between.view().items.values()].some(i => i.kind === 'bar' && i.status === 'found'), undefined, { polling: 250, timeout: 20_000 })
      await Bp.waitForFunction(() => [...(window as unknown as { __between: { things: Map<string, Th> } }).__between.things.values()].every(t => t.kind !== 'bar' || !JSON.stringify(t.item).includes('"left"')), undefined, { polling: 250, timeout: 20_000 })
      const b = await bars(Bp); if (b.some(x => x.column)) throw new Error('column still on: ' + JSON.stringify(b))
      const del = await A.evaluate(async id => (await fetch(`/api/between/${(window as unknown as { __between: { ids(): { gardenId: string } } }).__between.ids().gardenId}/doc`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: 'items/' + id, op: 'delete' }) })).status, id)
      if (del < 400) throw new Error('a read bar was taken back')
      return 'found, column off, a read bar stays'
    })
    await step('five bars lie in a fan; the sixth makes one deck', async () => {
      for (let i = 2; i <= 5; i++) await rawBar(A, 'pl-planter', i)
      await pollNow(A); await A.waitForFunction(() => [...(window as unknown as { __between: { things: Map<string, Th> } }).__between.things.values()].filter(t => t.kind === 'bar').length === 5, undefined, { polling: 250, timeout: 20_000 })
      await lookAtTable(A); await shot(A, 'five-fan-desktop')
      await rawBar(Bp, 'pl-partner', 6)
      await pollNow(A); await A.waitForFunction(() => { const T = (window as unknown as { __between: { things: Map<string, Th> } }).__between.things; return [...T.keys()].filter(k => T.get(k)!.kind === 'bar').join() === 'deck:bars' }, undefined, { polling: 250, timeout: 20_000 })
      await lookAtTable(A); await shot(A, 'deck-desktop')
      await openSheet(A, 'bardeck')
      await A.waitForFunction(() => document.querySelectorAll('#sheet [data-open="bar"]').length === 6, undefined, { polling: 200, timeout: 10_000 })
      return 'fan of five, then one deck listing six'
    })
  } finally {
    await browser.close().catch(() => {}); await phone.close().catch(() => {}); srv.close()
  }
  if (errors.length) { console.log('page errors:\n  ' + errors.slice(0, 5).join('\n  ')); failStep('page errors', String(errors.length)) }
  const bad = results.filter(r => !r.ok)
  console.log(bad.length ? `\n${bad.length} of ${results.length} steps failed` : `\nbetween bar check: all ${results.length} steps passed`)
  process.exit(bad.length ? 1 : 0)
}
/* a bar written straight through the page's own write path, as the form does */
const rawBar = (p: Page, who: string, n: number) => p.evaluate(async ([who, n]) => {
  const b = (window as unknown as { __between: { ids(): { gardenId: string } } }).__between
  const r = await fetch(`/api/between/${b.ids().gardenId}/doc`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: 'items/bx' + n, op: 'set', data: { kind: 'bar', by: who, at: Date.now() + Number(n), status: 'left', title: 'Bar number ' + n, lines: ['line one', 'line two'], history: { h: { act: 'left a bar', by: who, at: 1 } } } }) })
  if (!r.ok) throw new Error('write failed ' + r.status)
}, [who, n] as [string, number])
main().catch(e => { console.error(e); process.exit(1) })
