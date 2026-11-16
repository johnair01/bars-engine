import { safeTonight } from './safe'
import { MAX_MINUTES, MAX_TICKETS, MOVES, type CloseRecord, type Move, type RatingKey, type Safety, type Ticket } from './types'

/**
 * What a chat reply may say (FR-003). The board's taps and the chat's short replies both become one of these, and
 * `step` is the one function that changes the record, so either door resumes the other. Nothing here posts work:
 * `send` only names a ticket, and lever.ts is the one path that may push it.
 */
export type Command =
  | { do: 'rate'; ratings: Partial<Record<RatingKey, number>> }
  | { do: 'held'; held: 'yes' | 'partly' | 'no' }
  | { do: 'keep'; n: number }
  | { do: 'push'; n: number; reason: string }
  | { do: 'send'; n: number }
  | { do: 'lantern'; n: number }
  | { do: 'win'; id: string; n: number }
  | { do: 'next' }
  | { do: 'skip' }
  | { do: 'sentence'; text: string }
  | { do: 'unpack'; lines: string[] }
  | { do: 'error'; why: string }

const RATE = /^(?:[ptw][1-5])(?:\s+[ptw][1-5])*$/i
const KEY: Record<string, RatingKey> = { p: 'peace', t: 'triumph', w: 'wonder' }
const rating = (n: string) => { const v = Number(n); return Number.isInteger(v) && v >= 1 && v <= 5 ? v : null }

/** Read one chat reply at a move. A sentence at the glass move and three lines at the unpacking move are free text. */
export function parse(input: string, move: Move): Command {
  const text = input.trim()
  if (!text) return { do: 'error', why: 'Say something, or "skip" to skip this step.' }
  const low = text.toLowerCase()
  if (low === 'next') return { do: 'next' }
  if (low === 'skip') return { do: 'skip' }
  if (move === 'unpacking' && !/^(next|skip)$/.test(low)) {
    const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean)
    return lines.length === 3 ? { do: 'unpack', lines }
      : { do: 'error', why: `Three lines, one each for Peace, Triumph and Wonder. I got ${lines.length}.` }
  }
  if (RATE.test(text)) {
    const ratings: Partial<Record<RatingKey, number>> = {}
    for (const part of text.split(/\s+/)) ratings[KEY[part[0].toLowerCase()]] = Number(part[1])
    return { do: 'rate', ratings }
  }
  let m = /^held\s+(yes|partly|no)$/i.exec(text)
  if (m) return { do: 'held', held: m[1].toLowerCase() as 'yes' | 'partly' | 'no' }
  m = /^(keep|send|lantern)\s+(\d+)$/i.exec(text)
  if (m) return { do: m[1].toLowerCase() as 'keep' | 'send' | 'lantern', n: Number(m[2]) }
  m = /^push\s+(\d+)\s*:\s*([\s\S]+)$/i.exec(text)
  if (m) return { do: 'push', n: Number(m[1]), reason: m[2].trim() }
  if (/^push\b/i.test(text)) return { do: 'error', why: 'Say why: push <n>: <reason>.' }
  m = /^win\s+(\S+)\s+(\d+)$/i.exec(text)
  if (m) return rating(m[2]) ? { do: 'win', id: m[1], n: Number(m[2]) } : { do: 'error', why: 'A win lights a lantern from 1 to 5.' }
  if (move === 'glass') return { do: 'sentence', text }
  return { do: 'error', why: `That does not fit this step. Reply: ${text.length > 40 ? 'one of the commands below' : `"${text}" is not one`}.` }
}

export interface Step { record: CloseRecord; error?: string; send?: string }

const clone = (r: CloseRecord): CloseRecord => JSON.parse(JSON.stringify(r))

function advance(r: CloseRecord): void {
  const i = MOVES.indexOf(r.move)
  if (i >= MOVES.length - 1) r.status = 'closed'
  else r.move = MOVES[i + 1]
}

/** Apply one command to a close record. Pure: returns a new record, or the old one with an error to say. */
export function step(prev: CloseRecord, cmd: Command): Step {
  const r = clone(prev)
  const fail = (error: string): Step => ({ record: prev, error })
  if (r.status !== 'open') return fail(`This close is ${r.status}.`)
  switch (cmd.do) {
    case 'error': return fail(cmd.why)
    case 'next': advance(r); return { record: r }
    case 'skip': r.skipped.push(r.move); advance(r); return { record: r }
    case 'sentence':
      if (r.move !== 'glass') return fail('A sentence goes at the glass step.')
      if (r.after.triumph && !r.challenged && r.sentence) {
        r.pushback.push({ from: 'wendell', text: `What would show Triumph false: ${cmd.text}` })
        r.challenged = true
      } else r.sentence = cmd.text
      return { record: r }
    case 'held': r.held = cmd.held; return { record: r }
    case 'rate':
      if (r.move !== 'glass') return fail('Ratings go at the glass step.')
      for (const [k, n] of Object.entries(cmd.ratings)) r.after[k as RatingKey] = { n: n as number, about: r.after[k as RatingKey]?.about ?? '' }
      return { record: r }
    case 'win': {
      const it = r.items.find(i => i.id === cmd.id)
      if (!it || !it.proof) return fail(`No sealed item "${cmd.id}" in today's work.`)
      if (it.stage !== 'done') return fail(`"${cmd.id}" is not done yet, so it has no lantern to light.`)
      r.wins[cmd.id] = cmd.n
      return { record: r }
    }
    case 'unpack': r.unpacking = cmd.lines; return { record: r }
    case 'push': {
      const p = r.picks[cmd.n - 1]
      if (!p) return fail(`There is no pick ${cmd.n}.`)
      p.state = 'pushed'; p.reason = cmd.reason
      r.pushback.push({ from: 'wendell', text: `Pick ${cmd.n}: ${cmd.reason}` })
      return { record: r }
    }
    case 'keep': {
      const p = r.picks[cmd.n - 1]
      if (!p) return fail(`There is no pick ${cmd.n}.`)
      p.state = 'kept'
      if (r.move === 'plan' && !r.plan.tickets.some(t => t.id === String(cmd.n))) {
        if (r.plan.tickets.length >= MAX_TICKETS) return fail(`The plan holds at most ${MAX_TICKETS} tickets.`)
        const tooLong = p.minutes > MAX_MINUTES
        const hull: Ticket['hull'] = tooLong ? 'waits' : safeTonight(r, p) ? 'zo' : 'yours'
        r.plan.tickets.push({ id: String(cmd.n), title: p.text, hull, source: `${p.face} pick ${cmd.n}`, minutes: p.minutes,
          lane: 'zo', released: false, safety: pickSafety(p) })
      }
      return { record: r }
    }
    case 'lantern': {
      const p = r.picks[cmd.n - 1]
      if (!p) return fail(`There is no pick ${cmd.n}.`)
      if (p.state !== 'kept') return fail(`Keep pick ${cmd.n} first, then name it the lantern.`)
      r.picks.forEach(x => { x.lantern = false })
      p.lantern = true
      r.plan.lantern = { title: p.text, source: `${p.face} pick ${cmd.n}` }
      return { record: r }
    }
    case 'send': {
      if (r.move !== 'lever') return fail('The lever is the last step. Reply "next" until you reach it.')
      const t = r.plan.tickets.find(x => x.id === String(cmd.n))
      if (!t) return fail(`There is no ticket ${cmd.n}.`)
      if (t.hull !== 'zo') return fail(`Ticket ${cmd.n} is not in Zo tonight, so the lever does not take it.`)
      if (r.sent.includes(t.id)) return fail(`Ticket ${cmd.n} already went.`)
      return { record: r, send: t.id }
    }
  }
}

function pickSafety(p: Safety): Safety {
  const { reversible, oneLane, endsInPrOrRow, merges, spend, outreach, touchesFaces, nextOwner } = p
  return { reversible, oneLane, endsInPrOrRow, merges, spend, outreach, touchesFaces, nextOwner }
}
