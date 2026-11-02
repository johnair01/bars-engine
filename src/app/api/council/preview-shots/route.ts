/**
 * @route POST /api/council/preview-shots
 * @entity PLAYER
 * @description A screenshot sent from a preview (the Between's More sheet), with a note and what the page knew, for the council to read
 * @permissions signed-in player (bars_player_id cookie); on a Vercel preview a mark may come unsigned
 * @example POST /api/council/preview-shots { "page": "https://…/ontology-game/between?g=…", "note": "froze here", "image": "data:image/jpeg;base64,…", "state": { … } }
 * @description A chalk mark (public/marks/chalk.js): a held finger's spot, his one line, the look it sits on and the errors
 *   the page caught; the picture is optional. Each mark also lands on the Council Board as a causes row, mark-<time>.
 * @example POST /api/council/preview-shots { "page": "https://…/board/council", "note": "camera's under the table edge", "mark": { "x": 120, "y": 340, "w": 375, "h": 812 }, "look": "pm-mark-look-1", "errLog": [] }
 * @agentDiscoverable false
 *
 * @route GET /api/council/preview-shots
 * @description The shots sent lately, newest first, each with its image link and note
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or ?token=
 * @example GET /api/council/preview-shots?since=2026-10-24T00:00:00Z&token=<COUNCIL_MENU_TOKEN>
 */
import { NextRequest, NextResponse } from 'next/server'
import { list, put } from '@vercel/blob'
import { getCurrentPlayer } from '@/lib/auth'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { db } from '@/lib/db'
import { sessionWrite } from '@/lib/board/session-write'
import { dispatchBoardPull } from '@/lib/board/dispatch'

/**
 * Wendell, 2026-10-24 (board note, on the Between freezing as he stepped onto the dais): he wants a way to upload
 * screenshots from the preview. The page sends the canvas as a JPEG with his note, the page link and the errors it
 * caught; each lands in Vercel Blob as preview-shots/<time>.jpg beside a .json of the same name. No table, so no
 * migration: a thread reads them back with GET under COUNCIL_MENU_TOKEN.
 *
 * The chalk ring (his pick on pm-mark-look-1, option A) sends a mark: where his finger held, his one line, and maybe a
 * picture. Every mark keeps who, when, which page and which build, and lands on the Council Board as a row so it is
 * never dropped.
 */
const PREFIX = 'preview-shots/'
const MAX_IMAGE = 3_000_000 // bytes of JPEG, under Vercel's 4.5 MB body limit once base64
const LOOK = /^[a-z0-9-]+$/i

type Mark = { x: number; y: number; w: number; h: number }
const num = (v: unknown, lo: number, hi: number) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi

/** A mark's hold point and viewport, in CSS px; null when it is not one. */
function parseMark(v: unknown): Mark | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const m = v as Record<string, unknown>
  if (!(num(m.x, 0, 20000) && num(m.y, 0, 20000) && num(m.w, 1, 20000) && num(m.h, 1, 20000))) return null
  const r = (n: unknown) => Math.round((n as number) * 10) / 10
  return { x: r(m.x), y: r(m.y), w: r(m.w), h: r(m.h) }
}

/** What the server knows of this build: Vercel's own variables, null off Vercel. */
function build() {
  return {
    pr: process.env.VERCEL_GIT_PULL_REQUEST_ID || null,
    build: process.env.VERCEL_GIT_COMMIT_SHA || null,
    branch: process.env.VERCEL_GIT_COMMIT_REF || null,
    env: process.env.VERCEL_ENV || null,
  }
}

function pathOf(page: string): string {
  try { return new URL(page).pathname } catch { return page.slice(0, 200) || 'a page' }
}

export async function POST(req: NextRequest) {
  let body: { page?: unknown; note?: unknown; image?: unknown; state?: unknown; mark?: unknown; look?: unknown; errLog?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Send JSON' }, { status: 400 })
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Send JSON' }, { status: 400 })
  const hasMark = body.mark !== undefined && body.mark !== null
  const mark = hasMark ? parseMark(body.mark) : null
  if (hasMark && !mark) return NextResponse.json({ error: 'mark must be {x, y, w, h} in CSS pixels' }, { status: 400 })

  const player = await getCurrentPlayer().catch(() => null)
  // A Vercel preview sits behind Vercel's deployment protection, so a mark from one may come unsigned; production
  // still needs a player.
  const unsignedOk = !!mark && process.env.VERCEL_ENV === 'preview'
  if (!player && !unsignedOk) return NextResponse.json({ error: 'Sign in to bars-engine to send a screenshot' }, { status: 401 })

  const hasImage = body.image !== undefined && body.image !== null && body.image !== ''
  const m = typeof body.image === 'string' ? body.image.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/) : null
  if ((hasImage || !mark) && !m) return NextResponse.json({ error: 'image must be a JPEG or PNG data URL' }, { status: 400 })
  const bytes = m ? Buffer.from(m[2], 'base64') : null
  if (bytes && bytes.length > MAX_IMAGE) return NextResponse.json({ error: 'The screenshot is too large' }, { status: 413 })

  if (body.look !== undefined && body.look !== null && !(typeof body.look === 'string' && body.look.length <= 80 && LOOK.test(body.look)))
    return NextResponse.json({ error: 'look must be a look id (letters, digits, hyphens; at most 80)' }, { status: 400 })
  const look = typeof body.look === 'string' ? body.look : null
  if (body.errLog !== undefined && body.errLog !== null
      && !(Array.isArray(body.errLog) && body.errLog.length <= 20 && body.errLog.every(e => typeof e === 'string' && e.length <= 500)))
    return NextResponse.json({ error: 'errLog must be at most 20 strings of at most 500 characters' }, { status: 400 })
  const errLog = Array.isArray(body.errLog) ? (body.errLog as string[]) : []

  const note = typeof body.note === 'string' ? body.note.slice(0, 4000) : ''
  const page = typeof body.page === 'string' ? body.page.slice(0, 2048) : ''
  const at = new Date().toISOString()
  const stamp = at.replace(/[:.]/g, '-')
  const who = { player: player?.id ?? null, name: player?.name ?? 'unsigned' }
  const meta: Record<string, unknown> = { at, ...who, page, note, image: null as string | null, state: body.state ?? null }
  if (mark) Object.assign(meta, { mark, look, errLog, ...build() })

  let stored = true
  try {
    if (m && bytes) {
      const img = await put(`${PREFIX}${stamp}.${m[1] === 'png' ? 'png' : 'jpg'}`, bytes, { access: 'public', contentType: `image/${m[1]}`, addRandomSuffix: true })
      meta.image = img.url
      await put(img.pathname.replace(/\.(jpg|png)$/, '.json'), JSON.stringify(meta, null, 2), { access: 'public', contentType: 'application/json', addRandomSuffix: false })
    } else {
      const rand = Math.random().toString(36).slice(2, 10)
      await put(`${PREFIX}${stamp}-${rand}.json`, JSON.stringify(meta, null, 2), { access: 'public', contentType: 'application/json', addRandomSuffix: false })
    }
  } catch (e) {
    console.error('[preview-shots]', e instanceof Error ? e.message : e)
    stored = false
    // A mark still goes to the board below, so his line is not lost with the picture store.
    if (!mark) return NextResponse.json({ error: 'The screenshot could not be stored' }, { status: 503 })
  }
  if (!mark) return NextResponse.json({ ok: true, image: meta.image })

  const row = await landRow(stamp, meta, note, page, look).catch(e => {
    console.error('[preview-shots] row', e instanceof Error ? e.message : e)
    return false
  })
  if (!stored && !row) return NextResponse.json({ error: 'The mark could not be stored' }, { status: 503 })
  return NextResponse.json({ ok: true, image: meta.image, stored, row })
}

/** The mark as a Council Board row, `causes` (the board's list of things gone wrong, and the only kind a description
 * alone makes), written the way /api/board/session-writes writes one, then a board-pull to land it on main. */
async function landRow(stamp: string, meta: Record<string, unknown>, note: string, page: string, look: string | null): Promise<boolean> {
  const pr = meta.pr as string | null
  const line = note.trim() || 'A spot marked without a line'
  const desc = `${line} (on ${pathOf(page)}${pr ? `, preview of pull request #${pr}` : ''})`
  const image = meta.image
  const markMeta = { ...meta }
  delete markMeta.image
  delete markMeta.state
  const data: Record<string, unknown> = { kind: 'causes', pass: 'preview-marks', desc, mark: markMeta, pr }
  if (image) data.image = image
  if (look) data.look = look
  const r = await sessionWrite(db, [{ collection: 'rows', docId: `mark-${stamp}`, mode: 'set', data }])
  if (r.refused.length) { console.error('[preview-shots] row refused', r.refused.join('; ')); return false }
  await dispatchBoardPull().catch(() => undefined)
  return true
}

export async function GET(req: NextRequest) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  if (!secret) return NextResponse.json({ error: 'Council export is not configured' }, { status: 503 })
  if (!tokenMatches(givenToken(req), secret)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const since = req.nextUrl.searchParams.get('since')
  if (since && Number.isNaN(Date.parse(since))) return NextResponse.json({ error: 'since must be a time' }, { status: 400 })
  try {
    const { blobs } = await list({ prefix: PREFIX, limit: 1000 })
    const metas = blobs.filter(b => b.pathname.endsWith('.json') && (!since || b.uploadedAt > new Date(since)))
    metas.sort((a, b) => +b.uploadedAt - +a.uploadedAt)
    const shots = await Promise.all(metas.slice(0, 50).map(async b => {
      try { return await (await fetch(b.url, { cache: 'no-store' })).json() } catch { return { meta: b.url, error: 'unreadable' } }
    }))
    return NextResponse.json({ shots })
  } catch (e) {
    console.error('[preview-shots]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'The shots could not be listed' }, { status: 503 })
  }
}
