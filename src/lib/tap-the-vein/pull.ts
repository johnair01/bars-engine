/**
 * "Pull what's useful" (six-faces-council pass `ttv-book2`, 2026-11-17).
 * Reads one free write and offers up to three of the writer's own sentences. Fixed rules, no model: the free write
 * never leaves this function (`mm-raw`). A locally hosted model may only re-rank these same candidates (see
 * `reRankLocal`); nothing here calls a cloud service, and no sentence is logged.
 */

export const PULL_MAX_OFFERS = 3
export const PULL_LINE_MAX = 140

export type PullOffer = { line: string; start: number; end: number; why: string }

/** Phrases that point forward: the writer is naming something they might do. */
const FORWARD = [
  /\bi want to\b/i, /\bi want\b/i, /\bi need to\b/i, /\bi need\b/i, /\bi should\b/i, /\bi could\b/i,
  /\bi(?:'m| am) going to\b/i, /\bi will\b/i, /\bwhat if\b/i, /\bi wish\b/i, /\bi keep meaning to\b/i,
]

const STOP = new Set(
  'that this with have from they them then than there their about would could should which what when were been will your just into only also very much more some like because still even over such these those'.split(' '),
)

type Sentence = { text: string; start: number; end: number }

/** Split on sentence marks and line breaks, keeping each sentence's offsets in the raw text. */
export function splitSentences(raw: string): Sentence[] {
  const out: Sentence[] = []
  const re = /[^.!?\n]+[.!?]*/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw))) {
    const lead = m[0].length - m[0].trimStart().length
    const text = m[0].trim()
    if (text) out.push({ text, start: m.index + lead, end: m.index + lead + text.length })
  }
  return out
}

const words = (s: string) => s.toLowerCase().match(/[a-z']+/g) ?? []
const norm = (s: string) => words(s).join(' ')

/** Words (4+ letters, not filler) the write says three or more times. */
function repeatedWords(raw: string): Set<string> {
  const n = new Map<string, number>()
  for (const w of words(raw)) if (w.length >= 4 && !STOP.has(w)) n.set(w, (n.get(w) ?? 0) + 1)
  return new Set([...n].filter(([, c]) => c >= 3).map(([w]) => w))
}

function trim(line: string): string {
  if (line.length <= PULL_LINE_MAX) return line
  const cut = line.slice(0, PULL_LINE_MAX - 1)
  return cut.slice(0, cut.lastIndexOf(' ') > 60 ? cut.lastIndexOf(' ') : cut.length) + '…'
}

/** Candidates in score order. Exposed so a local model can re-rank the same list and nothing else. */
export function pullCandidates(rawEntry: string, keptLines: string[] = []): (PullOffer & { score: number })[] {
  const kept = keptLines.map(norm).filter(Boolean)
  const repeats = repeatedWords(rawEntry)
  const scored: (PullOffer & { score: number })[] = []
  for (const s of splitSentences(rawEntry)) {
    const n = norm(s.text)
    if (words(s.text).length < 4) continue
    if (kept.some((k) => n.includes(k) || k.includes(n))) continue
    let score = 0
    let why = ''
    if (FORWARD.some((re) => re.test(s.text))) { score += 3; why = 'You pointed forward here.' }
    if (s.text.endsWith('?')) { score += 2; why = why || 'You asked this.' }
    const hits = words(s.text).filter((w) => repeats.has(w))
    if (hits.length) { score += Math.min(2, new Set(hits).size); why = why || `You kept coming back to “${hits[0]}”.` }
    if (score === 0) continue
    scored.push({ line: trim(s.text), start: s.start, end: s.end, why, score })
  }
  // Highest score first; a tie goes to the sentence nearer the top of the page.
  return scored.sort((a, b) => b.score - a.score || a.start - b.start)
}

export function pullOffers(rawEntry: string, keptLines: string[] = []): PullOffer[] {
  return pullCandidates(rawEntry, keptLines)
    .slice(0, PULL_MAX_OFFERS)
    .map(({ line, start, end, why }) => ({ line, start, end, why }))
}

/**
 * Optional re-rank by a LOCALLY hosted, OpenAI-shaped model (`TTV_PULL_MODEL_URL`). It receives only the candidate
 * lines the rules already chose, never the whole write, and may only reorder them. Unset, or any failure or odd reply,
 * returns the input order. Cloud hosts are refused.
 */
export async function reRankLocal(offers: PullOffer[], url = process.env.TTV_PULL_MODEL_URL): Promise<PullOffer[]> {
  if (!url || offers.length < 2) return offers
  let host: string
  try { host = new URL(url).hostname } catch { return offers }
  if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(host)) return offers
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `Order these lines from most to least worth acting on. Reply with the numbers only, comma separated.\n${offers.map((o, i) => `${i + 1}. ${o.line}`).join('\n')}` }],
      }),
      signal: AbortSignal.timeout(4000),
    })
    const text: string = (await res.json())?.choices?.[0]?.message?.content ?? ''
    const order = (text.match(/\d+/g) ?? []).map((n) => Number(n) - 1)
    if (order.length !== offers.length || new Set(order).size !== offers.length || order.some((i) => i < 0 || i >= offers.length)) return offers
    return order.map((i) => offers[i])
  } catch {
    return offers
  }
}

/**
 * Who may use the pull in this version. Wendell, 2026-11-17: "For my own tap the veins this is allowed as I'm the only
 * user right now for THIS version. The tap the vein for general users shouldn't have AI reading them unless people
 * choose it and we create an interface for them." So the pull is on for the admin (his own book) and off for everyone
 * else. A general-user opt-in interface is future work, not part of this build.
 */
export function pullAllowedFor(player: { roles?: { role: { key: string } }[] } | null | undefined): boolean {
  return !!player?.roles?.some((r) => r.role.key === 'admin')
}
