/**
 * The notice email (friendship-between-growth FR-009, FR-010): when a friend answers a card, pours a cup or answers a turn,
 * the other friend gets one short email, at most one per Between per day of the Between, on by default, one tap off.
 * The row is written before the send (persist-then-send); a unique row per (garden, player, day) is the once-a-day rule.
 * The email names the Between and the friend, never the card's words and never a count of days.
 */
import { createHmac, timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { absoluteUrl } from '@/lib/email/awaken'
import { betweenDay } from '../../../public/between/games/core.js'
import type { Doc } from './rules'

const secret = () => {
  const s = process.env.BETWEEN_NOTICE_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
  if (s) return s
  if (process.env.NODE_ENV === 'production') throw new Error('BETWEEN_NOTICE_SECRET is not set')
  return 'dev-only-between-notice-secret'
}
const sig = (playerId: string) => createHmac('sha256', secret()).update('between-notice|' + playerId).digest('base64url')

/** The signed token the email's "Stop these emails" link carries: the player and a signature, no sign-in. */
export const stopToken = (playerId: string) => `${Buffer.from(playerId, 'utf8').toString('base64url')}.${sig(playerId)}`
export function readStopToken(token: string): string | null {
  const [a, b] = String(token).split('.')
  if (!a || !b) return null
  const id = Buffer.from(a, 'base64url').toString('utf8')
  const want = Buffer.from(sig(id)), got = Buffer.from(b)
  return want.length === got.length && timingSafeEqual(want, got) ? id : null
}

/** All of the email's words (voice_lint clean; no card words, no count). `name` is the other friend as the Between shows them. */
export function noticeCopy(name: string, goTo: string, stopTo: string) {
  const subject = `${name} answered you in your Between`
  const line = `${name} answered a card in your Between. Your turn waits at the table when you're ready.`
  return {
    subject,
    text: `${line}\n\nGo to your Between: ${goTo}\n\nStop these emails: ${stopTo}\n`,
    html: `<p>${esc(line)}</p><p><a href="${esc(goTo)}">Go to your Between</a></p><p style="font-size:12px;color:#777"><a href="${esc(stopTo)}">Stop these emails</a></p>`,
  }
}
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** Does this write leave something waiting on the other friend? An answer, a poured cup or a turn answered. */
export function leavesWaiting(table: string, op: string, data: Doc | null): boolean {
  if (table !== 'items' || !data || op === 'delete') return false
  if (data.kind === 'cup') return data.status === 'poured'
  if (data.kind === 'cast' || data.kind === 'turn') return !!data.answer && typeof data.answer === 'object'
  return false
}

/** After a write has stood. Never throws: a notice is a courtesy, the write is already kept. */
export async function noticeAfterWrite(gardenId: string, writerId: string, table: string, op: string, data: Doc | null, now = Date.now()): Promise<'sent' | 'off' | 'once' | 'none'> {
  try {
    if (!leavesWaiting(table, op, data)) return 'none'
    const g = await db.betweenGarden.findUnique({ where: { id: gardenId }, include: { members: true } })
    if (!g) return 'none'
    const doc = (g.data ?? {}) as Doc
    if (doc.kind === 'home') return 'none'
    const other = g.members.map(m => m.playerId).find(p => p !== writerId)
    if (!other) return 'none'
    const prefs = await db.betweenPrivate.findFirst({ where: { playerId: other, key: 'home' } })
    if (prefs && (prefs.data as Doc | null)?.notices === 'off') return 'off'
    const day = betweenDay(doc, now)
    try { await db.betweenNotice.create({ data: { gardenId, playerId: other, day } }) } catch { return 'once' } // unique: already sent today
    const [writer, rec] = await Promise.all([
      db.player.findUnique({ where: { id: writerId }, select: { name: true } }),
      db.player.findUnique({ where: { id: other }, select: { contactType: true, contactValue: true, account: { select: { email: true } } } }),
    ])
    const to = rec?.account?.email || (rec?.contactType === 'email' ? rec.contactValue : '')
    if (!to) return 'none'
    const copy = noticeCopy(writer?.name || 'Your friend', absoluteUrl(`/ontology-game/between?g=${gardenId}`), absoluteUrl(`/api/between/notices/stop?t=${stopToken(other)}`))
    const r = await sendEmail({ to, subject: copy.subject, html: copy.html, text: copy.text, tags: [{ name: 'funnel', value: 'between-notice' }] })
    return r.ok ? 'sent' : 'none'
  } catch (e) {
    console.warn('[between] notice failed', e)
    return 'none'
  }
}
