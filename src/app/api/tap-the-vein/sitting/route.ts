/**
 * @route GET /api/tap-the-vein/sitting
 * @entity PLAYER
 * @description Today's Tap the Vein sitting for the signed-in player, as the board's book reads it: the free write, the kept lines, whether it is sealed, and the six paths of the "something is in the way" page
 * @permissions signed-in player (bars_player_id cookie); the board is served from this origin, so no token goes in the page
 * @relationships PLAYER (TapTheVeinDailySession, TapTheVeinTask)
 * @dimensions WHO:the player, WHAT:one sitting, WHERE:the board's Morning book, ENERGY:daily planning
 * @example GET /api/tap-the-vein/sitting?tz=420
 * @agentDiscoverable false
 *
 * @route POST /api/tap-the-vein/sitting
 * @entity PLAYER
 * @description One step of the sitting: write, keep, offer (pull what's useful), plant, pull, rest, way (a feeling lights a path), take (a path's move), seal
 * @permissions signed-in player (bars_player_id cookie)
 * @relationships PLAYER (TapTheVeinDailySession, TapTheVeinTask)
 * @dimensions WHO:the player, WHAT:write, keep, pull, rest, way, take, seal, WHERE:the board's Morning book, ENERGY:daily planning
 * @example POST /api/tap-the-vein/sitting {"tz":420,"action":"keep","text":"Call the landlord"}
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { commitTask, getToday, restTask, saveBrainstorm, sealSession, updateTaskStatus } from '@/actions/tap-the-vein'
import { plantBarToGarden } from '@/actions/garden'
import { DISSATISFACTION_OPTIONS, EXPERIENCE_OPTIONS, SATISFACTION_OPTIONS } from '@/lib/quest-grammar/unpacking-constants'
import { sealMorningMenu } from '@/actions/tap-the-vein-menu'
import { parseTzOffset, ttvSessionDate, TTV_TZ_COOKIE } from '@/lib/tap-the-vein/day'
import { withTzOffset } from '@/lib/tap-the-vein/day-server'
import { pullAllowedFor, pullOffers, reRankLocal } from '@/lib/tap-the-vein/pull'
import { writePathTake } from '@/lib/tap-the-vein/path-take'
import { TTV_FEELINGS, TTV_PATHS, TTV_PATH_SOURCES, TTV_RELIED_SHOWN, pathLitBy, reliedLine } from '@/lib/tap-the-vein/paths'

const NO_STORE = { 'Cache-Control': 'no-store' }
/** The book keeps up to three lines (pass ttv-book1: "Keep up to three"). */
const BOOK_KEEP_MAX = 3
const MAX_FREE_WRITE = 20_000

type Step = { action?: unknown; text?: unknown; taskId?: unknown; feeling?: unknown; face?: unknown; tz?: unknown; source?: unknown; experienceIntent?: unknown; dissatisfaction?: unknown; satisfaction?: unknown }

async function view(allowPull = false) {
  const today = await getToday()
  if ('error' in today) return today
  const rows = await db.tapTheVeinTask.findMany({
    where: { dailySessionId: today.sessionId, source: { notIn: [...TTV_PATH_SOURCES] } },
    select: { id: true, status: true },
  })
  const status = new Map(rows.map((r) => [r.id, r.status]))
  // The record he keeps (gp-voice-rules-1): his latest "Relied on" lines, any day, newest first, shown on the Regent's card.
  const owner = await db.tapTheVeinDailySession.findUnique({ where: { id: today.sessionId }, select: { playerId: true } })
  const relied = !owner ? [] : await db.tapTheVeinTask.findMany({
    where: { playerId: owner.playerId, source: 'path-regent' },
    orderBy: { createdAt: 'desc' },
    take: TTV_RELIED_SHOWN,
    select: { originalText: true },
  })
  return {
    date: today.sessionDate,
    pulled: !!today.pulledAt,
    pullAllowed: allowPull,
    sealed: today.status === 'sealed',
    rawEntry: today.rawEntry,
    kept: today.tasks
      .filter((t) => status.has(t.id) && ['committed', 'in_progress'].includes(t.status))
      .map((t) => ({ id: t.id, text: t.text, pulled: t.status === 'in_progress' })),
    keepMax: BOOK_KEEP_MAX,
    triad: { experience: EXPERIENCE_OPTIONS, now: DISSATISFACTION_OPTIONS, want: SATISFACTION_OPTIONS },
    feelings: TTV_FEELINGS,
    paths: TTV_PATHS.map((p) => ({ face: p.face, lights: p.lights, move: p.move, prompt: p.prompt })),
    relied: relied.map((r) => reliedLine(r.originalText)),
  }
}

function reply(body: unknown, tz: number, status = 200) {
  const res = NextResponse.json(body, { status, headers: NO_STORE })
  res.cookies.set(TTV_TZ_COOKIE, String(tz), { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
  return res
}

export async function GET(req: NextRequest) {
  const tz = parseTzOffset(req.nextUrl.searchParams.get('tz'))
  const player = await getCurrentPlayer()
  if (!player) return reply({ error: 'Sign in to open your book' }, tz, 401)
  try {
    const v = await withTzOffset(tz, () => view(pullAllowedFor(player)))
    return reply(v, tz, 'error' in v ? 500 : 200)
  } catch (e) {
    console.error('[api:ttv-sitting:get]', e)
    return reply({ error: 'Failed to open the book' }, tz, 500)
  }
}

export async function POST(req: NextRequest) {
  const step = (await req.json().catch(() => null)) as Step | null
  const tz = parseTzOffset(step?.tz)
  const player = await getCurrentPlayer()
  if (!player) return reply({ error: 'Sign in to write in your book' }, tz, 401)
  if (!step || typeof step.action !== 'string') return reply({ error: 'Send { action }' }, tz, 400)
  const text = typeof step.text === 'string' ? step.text : ''
  const taskId = typeof step.taskId === 'string' ? step.taskId : ''

  try {
    return await withTzOffset(tz, async () => {
      const opened = await getToday() // get-or-create today's session
      if ('error' in opened) return reply(opened, tz, 500)
      if (opened.status === 'sealed' && step.action !== 'way') return reply({ error: 'Today’s book is sealed' }, tz, 409)

      switch (step.action) {
        case 'write': {
          if (text.length > MAX_FREE_WRITE) return reply({ error: 'That is too long for one morning' }, tz, 400)
          const r = await saveBrainstorm(text)
          return reply('error' in r ? r : await view(pullAllowedFor(player)), tz, 'error' in r ? 500 : 200)
        }
        case 'keep': {
          const live = await db.tapTheVeinTask.count({
            where: { dailySessionId: opened.sessionId, status: { in: ['committed', 'in_progress'] }, source: { notIn: [...TTV_PATH_SOURCES, 'board'] } },
          })
          if (live >= BOOK_KEEP_MAX) return reply({ error: 'Three lines are kept. Pull one or set one down first.' }, tz, 409)
          const r = await commitTask({ text, source: step.source === 'pull' ? 'pull' : undefined })
          return reply('error' in r ? r : await view(pullAllowedFor(player)), tz, 'error' in r ? 400 : 200)
        }
        case 'offer': {
          if (!pullAllowedFor(player)) return reply({ error: 'The pull is not on for this book' }, tz, 403)
          // "Pull what's useful": reads today's page here, once offered, and answers with the writer's own sentences.
          // Only a time and a count are stored; no sentence is logged. A second call recomputes the same offers.
          const kept = await db.tapTheVeinTask.findMany({
            where: { dailySessionId: opened.sessionId, source: { notIn: [...TTV_PATH_SOURCES] } },
            select: { originalText: true },
          })
          const offers = await reRankLocal(pullOffers(opened.rawEntry ?? '', kept.map((k) => k.originalText)))
          if (!opened.pulledAt) {
            await db.tapTheVeinDailySession.update({
              where: { id: opened.sessionId },
              data: { pulledAt: new Date(), pullOfferCount: offers.length },
            })
          }
          return reply({ offers, ...(await view(pullAllowedFor(player))) }, tz)
        }
        case 'plant': {
          // A kept card's BAR goes to the Garden through the usual triad (PlantTriad's three answers).
          const t = await db.tapTheVeinTask.findFirst({
            where: { id: taskId, dailySessionId: opened.sessionId, playerId: player.id },
            select: { questId: true, barId: true },
          })
          const barId = t?.questId ?? t?.barId
          if (!barId) return reply({ error: 'That card has no BAR to plant yet' }, tz, 400)
          const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
          const r = await plantBarToGarden({
            barId,
            experienceIntent: typeof step.experienceIntent === 'string' ? step.experienceIntent : '',
            dissatisfaction: strs(step.dissatisfaction),
            satisfaction: strs(step.satisfaction),
          })
          return reply('error' in r ? r : { planted: barId, ...(await view(pullAllowedFor(player))) }, tz, 'error' in r ? 400 : 200)
        }
        case 'pull': {
          const r = await updateTaskStatus({ taskId, status: 'in_progress' })
          return reply('error' in r ? r : await view(pullAllowedFor(player)), tz, 'error' in r ? 400 : 200)
        }
        case 'rest': {
          const r = await restTask(taskId)
          return reply('error' in r ? r : await view(pullAllowedFor(player)), tz, 'error' in r ? 400 : 200)
        }
        case 'way': {
          const p = pathLitBy(step.feeling)
          if (!p) return reply({ error: 'Name one of the feelings' }, tz, 400)
          return reply({ lit: p.face }, tz)
        }
        case 'take': {
          const r = await writePathTake(player.id, String(step.face ?? ''), text, ttvSessionDate(new Date(), tz))
          return reply('error' in r ? r : { record: r, ...(await view(pullAllowedFor(player))) }, tz, 'error' in r ? 400 : 200)
        }
        case 'seal': {
          // A sealed menu is what the council reads; a morning with no kept line closes the day without one.
          if (opened.tasks.some((t) => ['committed', 'in_progress'].includes(t.status))) {
            const m = await sealMorningMenu()
            if ('error' in m) return reply(m, tz, 400)
          }
          const r = await sealSession()
          return reply('error' in r ? r : await view(pullAllowedFor(player)), tz, 'error' in r ? 500 : 200)
        }
        default:
          return reply({ error: 'Unknown step' }, tz, 400)
      }
    })
  } catch (e) {
    console.error('[api:ttv-sitting:post]', e)
    return reply({ error: 'Failed to save that step' }, tz, 500)
  }
}
