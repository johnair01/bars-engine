import { hullsOf, dayHasRed } from './safe'
import { CAP_MINUTES, MAX_TICKETS, type CloseRecord, type Item, type Move, type RatingKey } from './types'

/** What a tap on the board or a short chat reply may set at this move. */
export interface Input { key: string; label: string; chat: string }
export interface Rendered { move: Move; title: string; text: string; inputs: Input[] }

type Ticket = CloseRecord['plan']['tickets'][number]
const KEYS: [RatingKey, string, string][] = [['peace', 'Peace', 'p'], ['triumph', 'Triumph', 't'], ['wonder', 'Wonder', 'w']]
const item = (i: Item) => `- ${i.title} (proof: ${i.proof})`

/** Minutes since the close began; 0 when it has no start time. */
export function minutesIn(r: CloseRecord, now = new Date()): number {
  if (!r.startedAt) return 0
  return Math.max(0, Math.floor((now.getTime() - new Date(r.startedAt).getTime()) / 60000))
}

/** The clock is the one line that changes with time, so it is passed in and left out of the parity comparison. */
export function clockLine(r: CloseRecord, now = new Date()): string {
  return `${minutesIn(r, now)} of ${CAP_MINUTES} minutes. Skip any step; a skipped step costs nothing.`
}

function glass(r: CloseRecord, now: Date): Rendered {
  const h = hullsOf(r)
  const L: string[] = []
  L.push(r.sentence ? `You said: ${r.sentence}` : 'Did this morning’s alchemy turn hold? Then, in one sentence, how did the day feel?')
  if (r.held) L.push(`This morning's turn held: ${r.held}.`)
  if (r.before && Object.keys(r.before).length)
    L.push('This morning: ' + KEYS.filter(([k]) => r.before![k]).map(([k, n]) => `${n} ${r.before![k]!.n}`).join(', ') + '.')
  const sections: [string, Item[]][] = [['Wins', h.wins], ['Momentum', h.momentum], ['Ready for tomorrow', h.ready], ['Safe to run tonight', h.tonight]]
  for (const [name, list] of sections) {
    L.push(`${name}:`)
    L.push(...(list.length ? list.map(item) : ['- nothing sealed here']))
  }
  if (h.refused) L.push(`Safe to run tonight is closed: ${h.refused}.`)
  if (h.unsealed) L.push(`${h.unsealed} item${h.unsealed === 1 ? '' : 's'} left out: no seal yet.`)
  L.push('Rate how the day gave you each, 1 to 5, from your own sense of it:')
  for (const [k, name] of KEYS) {
    const v = r.after[k]
    L.push(`- ${name}: ${v ? `${v.n} (about: ${v.about})` : 'not rated'}`)
  }
  if (r.after.triumph && !r.challenged) L.push('Challenger: what would show this Triumph false?')
  const wins = Object.entries(r.wins)
  if (wins.length) L.push('Lanterns lit: ' + wins.map(([id, n]) => `${r.items.find(i => i.id === id)?.title ?? id} (${n})`).join(', ') + '.')
  if (r.costPerAsset)
    L.push(`Cost per shipped asset: $${(r.costPerAsset.dollars / Math.max(1, r.costPerAsset.assets)).toFixed(2)} (${r.costPerAsset.source}).`)
  L.push(clockLine(r, now))
  return { move: 'glass', title: 'The Glass', text: L.join('\n'), inputs: [
    { key: 'sentence', label: 'Say the feeling', chat: 'any sentence' },
    ...KEYS.map(([k, n, c]) => ({ key: k, label: `Rate ${n}`, chat: `${c}<1-5>` })),
    { key: 'win', label: 'Light a lantern for a win', chat: 'win <id> <1-5>' }] }
}

function unpacking(r: CloseRecord, now: Date): Rendered {
  const L = ['What would give you each of these tomorrow? Three lines, one each for Peace, Triumph and Wonder.']
  KEYS.forEach(([, n], i) => L.push(`- ${n}: ${r.unpacking[i] ?? 'not yet said'}`))
  L.push(clockLine(r, now))
  return { move: 'unpacking', title: 'The Unpacking', text: L.join('\n'), inputs: [{ key: 'unpack', label: 'One line each', chat: 'three lines, in order' }] }
}

function pushback(r: CloseRecord, now: Date): Rendered {
  const L = ['The six faces guess what would give you each tomorrow. Keep a pick or push back on it.']
  if (!r.picks.length) L.push('The faces have not spoken yet.')
  r.picks.forEach((p, i) => L.push(`${i + 1}. ${p.face}: ${p.text} (${p.minutes} min)${p.state ? ` [${p.state}${p.reason ? `: ${p.reason}` : ''}]` : ''}`))
  for (const x of r.pushback) L.push(`${x.from === 'wendell' ? 'You' : 'A face'}: ${x.text}`)
  L.push(clockLine(r, now))
  return { move: 'pushback', title: 'The Pushback', text: L.join('\n'), inputs: [
    { key: 'keep', label: 'Keep a pick', chat: 'keep <n>' }, { key: 'push', label: 'Push back', chat: 'push <n>: <reason>' }] }
}

function plan(r: CloseRecord, now: Date): Rendered {
  const L = ['The Sage’s lantern plan: at most one lantern and five tickets, each under two hours.']
  L.push(r.plan.lantern ? `Lantern: ${r.plan.lantern.title} (from ${r.plan.lantern.source})` : 'Lantern: none agreed yet. Say "lantern <n>" for a kept pick.')
  const groups: [string, string, Ticket[]][] = [['Yours tomorrow', 'yours', []], ['Zo tonight', 'zo', []], ['Waits', 'waits', []]]
  for (const t of r.plan.tickets) groups.find(g => g[1] === t.hull)![2].push(t)
  for (const [name, , list] of groups) {
    L.push(`${name}:`)
    L.push(...(list.length ? list.map(t => `- ${t.id}. ${t.title} (${t.minutes} min, from ${t.source})`) : ['- none']))
  }
  L.push(`${r.plan.tickets.length} of ${MAX_TICKETS} tickets.`, clockLine(r, now))
  return { move: 'plan', title: 'The Sage’s Lantern Plan', text: L.join('\n'), inputs: [
    { key: 'lantern', label: 'Agree the lantern', chat: 'lantern <n>' }, { key: 'keep', label: 'Add a kept pick as a ticket', chat: 'keep <n>' }] }
}

function lever(r: CloseRecord, now: Date): Rendered {
  const L = ['The lever. Nothing goes to Zo until you pull it, one ticket at a time.']
  if (dayHasRed(r)) L.push('A check is red today, so nothing is safe to run tonight.')
  const dry = r.plan.tickets.filter(t => t.hull === 'zo')
  L.push('Dry run, what would go to Zo:')
  L.push(...(dry.length ? dry.map(t => `- ${t.id}. ${t.title} (${t.minutes} min)${r.sent.includes(t.id) ? ' [sent]' : ''}`) : ['- nothing']))
  L.push(clockLine(r, now))
  return { move: 'lever', title: 'The Lever', text: L.join('\n'), inputs: [{ key: 'send', label: 'Pull the lever for a ticket', chat: 'send <n>' }] }
}

const MOVE_FN: Record<Move, (r: CloseRecord, now: Date) => Rendered> = { glass, unpacking, pushback, plan, lever }

/** The one renderer (FR-002). The board and the chat both call it. */
export function renderMove(r: CloseRecord, move: Move = r.move, now = new Date()): Rendered { return MOVE_FN[move](r, now) }

/** The board door: structured lines for the page to draw. */
export function renderBoard(r: CloseRecord, move: Move = r.move, now = new Date()) {
  const x = renderMove(r, move, now)
  return { move: x.move, title: x.title, lines: x.text.split('\n'), inputs: x.inputs }
}

/** The chat door: the same text, then what a reply may say. */
export function renderChat(r: CloseRecord, move: Move = r.move, now = new Date()): string {
  const x = renderMove(r, move, now)
  return `${x.title}\n${x.text}\nReply: ${x.inputs.map(i => i.chat).join(' | ')}`
}

/** What a skipped night shows tomorrow morning: a plain line, never a streak (FR-010). */
export function skippedLine(): string { return 'Skipped. Tomorrow morning opens on last night’s lanterns.' }
