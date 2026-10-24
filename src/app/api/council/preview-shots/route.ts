/**
 * @route POST /api/council/preview-shots
 * @entity PLAYER
 * @description A screenshot sent from a preview (the Between's More sheet), with a note and what the page knew, for the council to read
 * @permissions signed-in player (bars_player_id cookie)
 * @example POST /api/council/preview-shots { "page": "https://…/ontology-game/between?g=…", "note": "froze here", "image": "data:image/jpeg;base64,…", "state": { … } }
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

/**
 * Wendell, 2026-10-24 (board note, on the Between freezing as he stepped onto the dais): he wants a way to upload
 * screenshots from the preview. The page sends the canvas as a JPEG with his note, the page link and the errors it
 * caught; each lands in Vercel Blob as preview-shots/<time>.jpg beside a .json of the same name. No table, so no
 * migration: a thread reads them back with GET under COUNCIL_MENU_TOKEN.
 */
const PREFIX = 'preview-shots/'
const MAX_IMAGE = 3_000_000 // bytes of JPEG, under Vercel's 4.5 MB body limit once base64

export async function POST(req: NextRequest) {
  const player = await getCurrentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to bars-engine to send a screenshot' }, { status: 401 })
  let body: { page?: unknown; note?: unknown; image?: unknown; state?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Send JSON' }, { status: 400 })
  }
  const m = typeof body.image === 'string' ? body.image.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/) : null
  if (!m) return NextResponse.json({ error: 'image must be a JPEG or PNG data URL' }, { status: 400 })
  const bytes = Buffer.from(m[2], 'base64')
  if (bytes.length > MAX_IMAGE) return NextResponse.json({ error: 'The screenshot is too large' }, { status: 413 })
  const note = typeof body.note === 'string' ? body.note.slice(0, 4000) : ''
  const page = typeof body.page === 'string' ? body.page.slice(0, 2048) : ''
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const ext = m[1] === 'png' ? 'png' : 'jpg'
  try {
    const img = await put(`${PREFIX}${stamp}.${ext}`, bytes, { access: 'public', contentType: `image/${m[1]}`, addRandomSuffix: true })
    const meta = { at: new Date().toISOString(), player: player.id, name: player.name, page, note, image: img.url, state: body.state ?? null }
    await put(img.pathname.replace(/\.(jpg|png)$/, '.json'), JSON.stringify(meta, null, 2), { access: 'public', contentType: 'application/json', addRandomSuffix: false })
    return NextResponse.json({ ok: true, image: img.url })
  } catch (e) {
    console.error('[preview-shots]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'The screenshot could not be stored' }, { status: 503 })
  }
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
