/** Score quest outputs of two prompts on the same chunks. usage: node score-lens.mjs chunks.json old.json new.json
 *  outputs are { "<chunk index>": [quest, ...] }. */
import { readFileSync } from 'node:fs'
const [chunksF, ...arms] = process.argv.slice(2)
const chunks = Object.fromEntries(JSON.parse(readFileSync(chunksF, 'utf8')).map((c) => [String(c.index), c.text]))
const norm = (s) => String(s ?? '').toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()
const words = (s) => norm(s).replace(/[^a-z0-9' ]/g, ' ').split(' ').filter(Boolean)
const JARGON = /\b(leverage|stakeholder|synerg\w*|framework|deliverable|actionable|best practices?|utilize|holistic|paradigm)\b/i
function fiveGramOverlap(desc, text) {
  const t = words(text).join(' ')
  const w = words(desc)
  for (let i = 0; i + 5 <= w.length; i++) if (t.includes(w.slice(i, i + 5).join(' '))) return true
  return false
}
for (const f of arms) {
  const data = JSON.parse(readFileSync(f, 'utf8'))
  let n = 0, src = 0, rest = 0, you = 0, jargon = 0, ground = 0, elder = 0, wc = 0
  for (const [idx, quests] of Object.entries(data)) for (const q of quests) {
    n++
    const text = chunks[idx] ?? ''
    const s = norm(q.sourceSentence).replace(/[.…]+$/, '')
    if (s.length >= 15 && norm(text).includes(s)) src++
    if (q.restPath) rest++
    if (/\byou(r)?\b/i.test(q.description)) you++
    if (JARGON.test(q.description + ' ' + q.title)) jargon++
    if (fiveGramOverlap(q.description, text)) ground++
    if (q.elder) elder++
    wc += words(q.description).length
  }
  const pct = (k) => (n ? Math.round((100 * k) / n) + '%' : '-')
  console.log(JSON.stringify({ arm: f, chunks: Object.keys(data).length, quests: n, verbatimSource: pct(src), restPath: pct(rest), elderTagged: pct(elder), speaksToYou: pct(you), jargon: pct(jargon), copiesBookPhrase: pct(ground), avgDescWords: n ? Math.round(wc / n) : 0 }))
}
