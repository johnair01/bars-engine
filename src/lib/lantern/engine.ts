/**
 * Lantern Hall engine (six-faces-council, council/callsheets/lantern-hall.md, brief "Lantern Hall, portable kit").
 *
 * A pure port of the v6 reel's ENGINE block (council artifacts/lantern-hall/v6/lantern-hall-v6.html, `init`, `strike`,
 * `settle`, `apply`, SCRIPT). No drawing, no storage, no window: the same rules run in a route, a test, a canvas page or
 * any other environment. The intake is a parameter rather than a page global, so a table plays from the player's own
 * intake. Tests in `__tests__/engine.test.ts` replay the 19-step script against the reel's own output.
 *
 * Rules (his scores and notes, 2026-11-01): oil is 4 per watch; a story move costs 1 and strikes for 2 when its kind
 * matches the keep, else 1; a ghost costs 1 and strikes for 2 when its real action is logged; lighting the table is free;
 * kibitzing costs 1; reading is free; "something stings" refines one step from inside; witness keeps need another person
 * in the story; the commander unlocks once min(3, the other active keeps) are held; untouched keeps grow by 1 at the end
 * of each watch; a strike in a new channel surfaces a loop; a strike on a fogged keep brings it out of the fog; gold loops
 * on both sides of an edge name a milestone. The block's cost is the sum of its loop strengths in refinements.
 *
 * Port 3 adds the hand (`lh-hand-basic`, `lh-hand-share`), the purchase cap and the spendable mint (`lh-buy-cap`,
 * `lh-bar-mint`), the minor wins (`lh-block-victory`) and the block's size from three sliders (`lh-block-size`,
 * `lh-payout-sliders`) on top of this (bars-engine .specify/specs/lantern-table/spec.md):
 * - a `basic` move, open to everyone, costs 1 oil and strikes for 1 whatever its kind;
 * - a `buy` move spends 1 vibeulon on a basic move, only when the oil is 0, at most BUY_CAP a watch;
 * - a BAR (`story`) mints 1 vibeulon into `vibeulons`, which buys a basic move at the same table;
 * - `share` weighs refinement dealt: a BAR's (and a logged action's or a kibitzer's BAR's) at 2, a basic move's at 1;
 * - `wins` marks each block found (a loop surfaces or a keep comes out of the fog) and each keep dissolved (held);
 *   `done` is set once every emerged keep is held.
 */

export type Channel = 'fire' | 'wood' | 'water' | 'metal' | 'earth'
export type Kind = 'Ask' | 'Ground' | 'Witness' | 'Evidence' | 'Impact' | 'Exposure'

export const CHANNELS: readonly Channel[] = ['fire', 'wood', 'water', 'metal', 'earth']
export const CHANNEL_NAME: Record<Channel, string> = { fire: 'Fire', wood: 'Wood', water: 'Water', metal: 'Metal', earth: 'Earth' }

export interface KeepDef { b: string; kind: Kind; witness: boolean; pred: Channel }

/** The six beliefs that become the six keeps. Index 0, Not good enough, is the commander. */
export const KEEPS: readonly KeepDef[] = [
  { b: 'Not good enough', kind: 'Ask', witness: true, pred: 'fire' },
  { b: 'Not worthy', kind: 'Ground', witness: true, pred: 'earth' },
  { b: "Don't belong", kind: 'Witness', witness: true, pred: 'water' },
  { b: 'Not capable', kind: 'Evidence', witness: false, pred: 'metal' },
  { b: 'Not significant', kind: 'Impact', witness: true, pred: 'wood' },
  { b: 'Not ready', kind: 'Exposure', witness: false, pred: 'water' },
]
export const CMD = 0

/** Each channel's three states: dissatisfied (lead), neutral, satisfied (gold). */
export const STATE: Record<Channel, [string, string, string]> = {
  fire: ['Frustration', 'Anger', 'Triumph'],
  wood: ['Craving', 'Joy', 'Bliss'],
  water: ['Despair', 'Sadness', 'Poignance'],
  metal: ['Anxiety', 'Fear', 'Wonder'],
  earth: ['Apathy', 'Neutral', 'Peace'],
}
/** Loop strength to state index: 2 or more is lead, 1 is neutral, 0 is gold. */
export const lvl = (g: number) => (g >= 2 ? 0 : g === 1 ? 1 : 2)

/** Gold on both sides of an edge names a milestone: [what it becomes, what it was]. Keyed by sorted channel pair. */
export const COMP: Record<string, [string, string]> = {
  'earth|water': ['Acceptance', 'Resignation'],
  'metal|water': ['the sublime', 'Dread'],
  'metal|wood': ['Awe', 'Shyness'],
  'fire|water': ['Glory', 'Disappointment'],
  'fire|metal': ['Courage', 'Disgust'],
  'earth|wood': ['Contentment', 'Restlessness'],
}

/** Tag strength on a reservation: 1 Minor, 2 Medium, 3 Major (0 or absent means untagged). */
export type TagStrength = 0 | 1 | 2 | 3

/**
 * The intake as the reel saves it (`intake/game`): goal, want (gold channels), now (lead channels with intensity),
 * truth (one toggle per channel), truthCtx (optional typed context), res (the six reservations on or off) and tags
 * (per reservation, the channels it stirs and how strongly). Only `res` and `tags` drive the engine.
 */
export interface Intake {
  goal: string
  goalCtx?: string
  want: Channel[]
  now: Partial<Record<Channel, number>>
  truth: Partial<Record<Channel, boolean>>
  truthCtx: Partial<Record<Channel, string>>
  res: boolean[]
  cmd?: number
  tags: Partial<Record<Channel, TagStrength>>[]
}

export interface Loop { ch: Channel; g: number }
export interface Keep {
  loops: Loop[]
  held: boolean
  holder: string | null
  ch: Channel | null
  touched: boolean
  ghost: Channel | null
  fog: boolean
  /** Untagged but on: plays a placeholder loop at strength 2 in its predominant channel. */
  ph: boolean
}
export interface Milestone { id: string; name: string; from: string; w: number; i: number; j: number }
export interface State {
  w: number
  oil: number
  lit: boolean
  milestones: Milestone[]
  keeps: Keep[]
  minted: number
  bars: { dir: 'in' | 'out' }[]
  dealt: Record<string, number>
  surfaced: { i: number; ch: Channel } | null
  opened?: boolean
  fx?: string
  /** Vibeulons spendable at this table: a BAR's mint lands here (`lh-bar-mint`). */
  vibeulons: number
  /** Weighted refinement by contributor: BAR 2, basic 1 (`lh-hand-share`). `payoutShare` normalizes it. */
  share: Record<string, number>
  /** Basic moves bought with vibeulons this watch (`lh-buy-cap`). */
  bought: number
  /** Minor wins, in order (`lh-block-victory`). */
  wins: Win[]
  /** Every emerged keep has dissolved: the round is done. */
  done: boolean
}

/** A minor win: a block found (a loop surfaced, or a keep out of the fog) or a keep dissolved. */
export interface Win { type: 'found' | 'dissolved'; i: number; w: number; ch?: Channel }

/** Basic moves a player may buy with vibeulons in one watch: the oil, 4 (`lh-buy-cap`). */
export const BUY_CAP = 4
/** Payout weight per refinement dealt (`lh-hand-share`). */
export const WEIGHT = { bar: 2, basic: 1 } as const

export type MoveType = 'intake' | 'fire' | 'story' | 'tick' | 'ghost' | 'light' | 'kibitzOut' | 'kibitzIn' | 'door' | 'read' | 'open' | 'basic' | 'buy'
export interface Move {
  w: number
  type: MoveType
  keep?: number
  ch?: Channel
  kind?: Kind
  withWitness?: boolean
  title?: string
  text?: string
  life?: string
  ph?: string
  src?: string
  who?: string
}

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))
const igStrength = (g: number) => clamp(g, 1, 3)

/**
 * Deal the table from an intake: each reservation that is on becomes a keep; one turned off becomes a fogged keep.
 * With `blockSize` (from `payout()`), the loop strengths are scaled to that total, each loop kept between 1 and 3.
 */
export function init(intake: Pick<Intake, 'res' | 'tags'>, opts: { blockSize?: number } = {}): State {
  const s: State = {
    w: 1, oil: 4, lit: false, milestones: [], minted: 0, bars: [], dealt: {}, surfaced: null,
    vibeulons: 0, share: {}, bought: 0, wins: [], done: false,
    keeps: KEEPS.map((k, i) => {
      const on = !!intake.res[i]
      const tg = intake.tags[i] || {}
      let loops: Loop[] = CHANNELS.filter(c => (tg[c] ?? 0) > 0).map(c => ({ ch: c, g: igStrength(tg[c] as number) }))
      let ph = false
      if (on && !loops.length) { loops = [{ ch: k.pred, g: 2 }]; ph = true }
      if (!on) loops = []
      return { loops, held: false, holder: null, ch: null, touched: false, ghost: null, fog: !on, ph }
    }),
  }
  if (opts.blockSize !== undefined) sizeBlock(s, opts.blockSize)
  return s
}

/** Scale the loops toward a block of `target` refinements: raise the weakest loop or lower the strongest, one at a time. */
function sizeBlock(s: State, target: number) {
  const loops = s.keeps.filter(k => !k.fog).flatMap(k => k.loops)
  if (!loops.length) return
  const total = () => loops.reduce((a, l) => a + l.g, 0)
  for (let guard = 0; guard < 100 && total() !== target; guard++) {
    if (total() < target) {
      const l = loops.filter(x => x.g < 3).sort((a, b) => a.g - b.g)[0]
      if (!l) break
      l.g++
    } else {
      const l = loops.filter(x => x.g > 1).sort((a, b) => b.g - a.g)[0]
      if (!l) break
      l.g--
    }
  }
}

/** The goal's three sliders (1 to 3 each). */
export interface Sliders { size: 1 | 2 | 3; charge: 1 | 2 | 3; deadline: 1 | 2 | 3 }

/**
 * The draft payout (`lh-payout-sliders` A, `lh-block-size`): the block's starting size is twice the sliders' sum (6 to
 * 18 refinements; 12 at the middle, the size six untagged keeps deal), and the vibeulon payout is that size weighted by
 * the deadline, a quarter more for each step nearer. A draft, shown at his look and tuned after two real tables.
 */
export function payout(sl: Sliders): { blockSize: number; vibeulons: number } {
  const c = (v: number) => clamp(Math.round(v), 1, 3)
  const blockSize = 2 * (c(sl.size) + c(sl.charge) + c(sl.deadline))
  return { blockSize, vibeulons: Math.round(blockSize * (0.75 + 0.25 * c(sl.deadline))) }
}

/** Each contributor's share of the payout: weighted refinement (BAR 2, basic 1), normalized to sum to 1. */
export function payoutShare(s: Pick<State, 'share'>): Record<string, number> {
  const total = Object.values(s.share).reduce((a, v) => a + v, 0)
  if (!total) return {}
  return Object.fromEntries(Object.entries(s.share).map(([k, v]) => [k, v / total]))
}

export const nHeld = (s: State) => s.keeps.filter(k => k.held).length
export const nActive = (s: State) => s.keeps.filter(k => !k.fog).length
/** How many keeps must be held before the commander can be struck: min(3, the other active keeps). */
export const cmdNeed = (s: State) => Math.min(3, s.keeps.filter((k, i) => !k.fog && i !== CMD).length)
/** The block's remaining cost in refinements: loop strengths summed over keeps neither held nor fogged. */
export const blockLeft = (s: State) => s.keeps.reduce((a, k) => a + (k.held || k.fog ? 0 : k.loops.reduce((b, l) => b + l.g, 0)), 0)

function settle(s: State, i: number, by: string, ch: Channel): string {
  const k = s.keeps[i]
  if (!k.loops.every(l => l.g === 0)) return ''
  k.held = true; k.holder = k.holder || by; k.ch = k.ch || ch; k.ghost = null
  let out = ` ${KEEPS[i].b} is held.`
  for (const j of [(i + 5) % 6, (i + 1) % 6]) {
    if (!s.keeps[j].held) continue
    for (const a of k.loops) for (const b of s.keeps[j].loops) {
      const c = COMP[[a.ch, b.ch].sort().join('|')]
      const id = [i, j].sort().join('-') + a.ch + b.ch
      if (c && !s.milestones.some(m => m.id === id)) {
        s.milestones.push({ id, name: c[0], from: c[1], w: s.w, i, j })
        out += ` Milestone: ${c[1]} transmutes into ${c[0]}.`
      }
    }
  }
  return out
}

/** Strike keep i for dmg refinements in channel ch, dealt by `by`. Mutates s; returns the line the table reads out. */
export function strike(s: State, i: number, dmg: number, ch: Channel, by: string): string {
  const k = s.keeps[i]
  if (k.held) return 'already held.'
  if (i === CMD && nHeld(s) < cmdNeed(s)) return `the commander is protected until ${cmdNeed(s)} keeps are held.`
  k.touched = true
  s.dealt[by] = (s.dealt[by] || 0) + dmg
  let out = ''
  if (k.fog) {
    k.fog = false; k.loops = [{ ch, g: 2 }]; s.surfaced = { i, ch }
    out += `${KEEPS[i].b} comes out of the fog. A ${CHANNEL_NAME[ch]} loop surfaces at ${STATE[ch][0]}. `
  }
  let loop = k.loops.find(l => l.ch === ch && l.g > 0)
  if (!loop) {
    loop = k.loops.find(l => l.g > 0)
    if (!k.loops.some(l => l.ch === ch)) {
      k.loops.push({ ch, g: 1 }); s.surfaced = { i, ch }
      out += `A ${CHANNEL_NAME[ch]} loop surfaces in ${KEEPS[i].b} at ${STATE[ch][1]}. `
      if (!loop) loop = k.loops[k.loops.length - 1]
    }
  }
  if (!loop) return out + 'no loop left to strike.'
  const before = loop.g
  loop.g = Math.max(0, loop.g - dmg)
  out += `Strikes for ${dmg}: ${STATE[loop.ch][lvl(before)]} becomes ${STATE[loop.ch][lvl(loop.g)]}.`
  return out + settle(s, i, by, ch)
}

const need = <T>(v: T | undefined, what: string): T => { if (v === undefined) throw new Error(`move needs ${what}`); return v }

/** Apply one move to a state. Returns a new state with `fx`, the line the table reads out; the input is not changed. */
export function apply(prev: State, m: Move): State {
  const s: State = JSON.parse(JSON.stringify(prev))
  s.vibeulons ??= 0; s.share ??= {}; s.bought ??= 0; s.wins ??= []; s.done ??= false
  s.surfaced = null
  let fx = ''
  if (m.w > s.w) { s.w = m.w; s.oil = 4; s.bought = 0; s.keeps.forEach(k => { k.touched = false }) }
  const weigh = (by: string, before: number, w: number) => { const d = (s.dealt[by] || 0) - before; if (d > 0) s.share[by] = (s.share[by] || 0) + d * w }
  const dealtBy = (by: string) => s.dealt[by] || 0
  switch (m.type) {
    case 'intake': {
      const a = nActive(s), f = 6 - a, ph = s.keeps.filter(k => k.ph).length
      fx = `${a} keep${a === 1 ? '' : 's'} dealt${f ? `, ${f} in fog` : ''}. The block takes ${blockLeft(s)} refinements to overcome. Lamp oil 4.` +
        (ph ? ` ${ph} keep${ph === 1 ? ' is' : 's are'} untagged, so ${ph === 1 ? 'it uses' : 'they use'} a placeholder loop at strength 2.` : '')
      break
    }
    case 'story': {
      const i = need(m.keep, 'keep'), kind = need(m.kind, 'kind'), ch = need(m.ch, 'ch')
      s.oil--; s.minted++; s.vibeulons++
      if (KEEPS[i].witness && !m.withWitness) { s.keeps[i].touched = true; fx = 'No witness in the story, so it deals no damage. It still mints a vibeulon.'; break }
      const match = kind === KEEPS[i].kind, by = m.who || 'You', b0 = dealtBy(by)
      fx = (match ? 'Kind matches. ' : 'Kind differs. ') + strike(s, i, match ? 2 : 1, ch, by) + ' Mints a vibeulon.'
      weigh(by, b0, WEIGHT.bar)
      break
    }
    case 'basic': {
      const i = need(m.keep, 'keep'), ch = need(m.ch, 'ch'), by = m.who || 'You'
      if (s.oil <= 0) { fx = 'The oil is out for this watch. A vibeulon buys a basic move now.'; break }
      const b0 = dealtBy(by)
      s.oil--
      fx = 'A basic move. ' + strike(s, i, 1, ch, by)
      weigh(by, b0, WEIGHT.basic)
      break
    }
    case 'buy': {
      const i = need(m.keep, 'keep'), ch = need(m.ch, 'ch'), by = m.who || 'You'
      if (s.oil > 0) { fx = `You still have ${s.oil} oil, so a vibeulon buys nothing yet.`; break }
      if (s.vibeulons < 1) { fx = 'You have no vibeulons to spend.'; break }
      if (s.bought >= BUY_CAP) { fx = `You have bought ${BUY_CAP} moves this watch, as many as the oil. Turn the watch.`; break }
      const b0 = dealtBy(by)
      s.vibeulons--; s.bought++
      fx = 'A vibeulon buys a basic move. ' + strike(s, i, 1, ch, by)
      weigh(by, b0, WEIGHT.basic)
      break
    }
    case 'ghost': {
      const i = need(m.keep, 'keep')
      s.oil--; s.keeps[i].ghost = need(m.ch, 'ch'); s.keeps[i].touched = true
      fx = 'Ghost placed. It strikes for 2 when the action is logged.'
      break
    }
    case 'fire': {
      // As in v6: a real action logged with no ghost before it (the reel's first move, on Not capable) spends oil.
      const i = need(m.keep, 'keep')
      if (!prev.keeps[i].ghost) s.oil--
      s.keeps[i].ghost = null
      const b0 = dealtBy('You')
      fx = 'Logged. ' + strike(s, i, 2, need(m.ch, 'ch'), 'You')
      weigh('You', b0, WEIGHT.bar)
      break
    }
    case 'light': s.lit = true; fx = 'Your table is open to kibitzers.'; break
    case 'kibitzOut': s.oil--; s.minted++; s.bars.push({ dir: 'out' }); fx = 'Strikes their keep for 2. You and the owner both mint in Water. Your BAR goes to their game master.'; break
    case 'kibitzIn': {
      const i = need(m.keep, 'keep'), match = need(m.kind, 'kind') === KEEPS[i].kind
      s.bars.push({ dir: 'in' })
      const b0 = dealtBy('Kibitzers')
      fx = (match ? 'Kind matches. ' : 'Kind differs. ') + strike(s, i, match ? 2 : 1, need(m.ch, 'ch'), 'Kibitzers')
      weigh('Kibitzers', b0, WEIGHT.bar)
      break
    }
    case 'door': {
      const i = need(m.keep, 'keep'), l = s.keeps[i].loops.find(x => x.g > 0)
      s.minted++
      if (l) { const b = l.g; l.g--; fx = `Refined from inside: ${STATE[l.ch][lvl(b)]} becomes ${STATE[l.ch][lvl(l.g)]}. Mints a colorless vibeulon.` + settle(s, i, 'You', l.ch) }
      break
    }
    case 'read': fx = `${s.bars.filter(b => b.dir === 'in').length} BARs read.`; break
    case 'tick': {
      const g: string[] = []
      s.keeps.forEach((k, i) => { if (!k.held && !k.touched) { k.loops.forEach(l => { if (l.g < 3) l.g++ }); g.push(KEEPS[i].b) } })
      fx = g.length ? `Shadow grows on ${g.join(' and ')}.` : 'No shadow grows.'
      break
    }
    case 'open': {
      const dark = s.keeps.filter(k => !k.fog && !k.held).length
      s.opened = dark === 0
      const pay = 'Contributors are paid in vibeulons by refinement dealt (' + Object.entries(s.dealt).map(([k, v]) => `${k} ${v}`).join(', ') + ') and keep the stories they collected.'
      fx = s.opened
        ? 'All active keeps are held. The goal is met. ' + pay
        : `${dark} keep${dark === 1 ? ' is' : 's are'} still dark, with ${blockLeft(s)} refinements left. The goal isn’t met, so you run another intake. ${pay}`
      break
    }
  }
  markWins(prev, s)
  s.fx = fx
  return s
}

/** Record the minor wins a move made (`lh-block-victory`) and whether the round is done. */
function markWins(prev: State, s: State) {
  s.keeps.forEach((k, i) => {
    const was = prev.keeps[i]
    if (was.fog && !k.fog) s.wins.push({ type: 'found', i, w: s.w, ch: k.loops[0]?.ch })
    else for (const l of k.loops) if (!was.loops.some(x => x.ch === l.ch)) s.wins.push({ type: 'found', i, w: s.w, ch: l.ch })
    if (k.held && !was.held) s.wins.push({ type: 'dissolved', i, w: s.w })
  })
  const emerged = s.keeps.filter(k => !k.fog)
  s.done = emerged.length > 0 && emerged.every(k => k.held)
}

/** Play a whole script from an intake. Returns the state after each move. */
export function run(intake: Pick<Intake, 'res' | 'tags'>, script: readonly Move[]): State[] {
  const out: State[] = []
  let s = init(intake)
  for (const m of script) { s = apply(s, m); out.push(s) }
  return out
}
