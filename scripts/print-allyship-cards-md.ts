/**
 * Write a Markdown review of the Allyship Deck's authored cards.
 * Run: npm run deck:print-md  →  output/allyship-deck/allyship-cards-review.md
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { assembleDeck } from '../src/lib/allyship-deck/assemble'
import type { MoveCard } from '../src/lib/allyship-deck/types'

const MOVE_LABEL: Record<string, string> = { wake_up: 'Wake Up', open_up: 'Open Up', clean_up: 'Clean Up', grow_up: 'Grow Up', show_up: 'Show Up' }
const OP_LABEL: Record<string, string> = { shaman: 'Shaman', challenger: 'Challenger', regent: 'Regent', architect: 'Architect', diplomat: 'Diplomat', sage: 'Sage' }
const DOMAIN_LABEL: Record<string, string> = { GATHERING_RESOURCES: 'Gather Resources', RAISE_AWARENESS: 'Raise Awareness', DIRECT_ACTION: 'Direct Action', SKILLFUL_ORGANIZING: 'Skillful Organizing' }
const MOVE_ORDER = ['wake_up', 'open_up', 'clean_up', 'grow_up', 'show_up']
const OP_ORDER = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']

const realList = (items: string[]) =>
  items && items.length && !(items.length === 1 && items[0] === '— author —') ? items.join(' · ') : null

function card(c: MoveCard): string {
  const lines = [
    `#### ${c.title}`,
    ``,
    `**${OP_LABEL[c.operation]} · ${MOVE_LABEL[c.move]} · ${DOMAIN_LABEL[c.domain]}** · \`${c.id}\`${c.status === 'generated' ? ' · _draft_' : ''}`,
    ``,
    `- **Self —** ${c.primaryQuestion}`,
    `- **Campaign —** ${c.campaignQuestion}`,
    `- **Optimizes for:** ${c.optimizesFor}`,
  ]
  const fb = realList(c.forbiddenMoves)
  if (fb) lines.push(`- **Forbidden:** ${fb}`)
  const fm = realList(c.failureModes)
  if (fm) lines.push(`- **Failure modes:** ${fm}`)
  lines.push(`- **Practice:** ${c.remediation}`)
  if (c.flavor) lines.push(`- _“${c.flavor}”_`)
  lines.push(`- restores: ${c.capabilities.join(', ') || '—'} · → ${c.outputBar} BAR`)
  lines.push('')
  return lines.join('\n')
}

function main() {
  const deck = assembleDeck('2026-06-15T00:00:00.000Z')
  const authored = deck.cards.filter((c): c is MoveCard => c.kind === 'move' && c.status === 'authored')
  authored.sort((a, b) => MOVE_ORDER.indexOf(a.move) - MOVE_ORDER.indexOf(b.move) || OP_ORDER.indexOf(a.operation) - OP_ORDER.indexOf(b.operation))

  const byDomain = new Map<string, MoveCard[]>()
  for (const c of authored) {
    if (!byDomain.has(c.domain)) byDomain.set(c.domain, [])
    byDomain.get(c.domain)!.push(c)
  }

  let md = `# The Allyship Deck — authored cards for review\n\n`
  md += `${authored.length} authored move cards (of 120). Each shows both question registers (Self / Campaign) and the full move anatomy. Draft (generated) cards excluded.\n\n`
  md += `Grammar: 5 Basic Moves × 6 Operations × 4 Domains. Capability Model: Fire/Agency · Water/Connection · Metal/Exploration · Earth/Rest · Wood/Participation.\n`

  for (const [domain, cards] of byDomain) {
    md += `\n---\n\n## ${DOMAIN_LABEL[domain]} — ${cards.length} cards\n\n`
    let lastMove = ''
    for (const c of cards) {
      if (c.move !== lastMove) {
        md += `\n### ▸ ${MOVE_LABEL[c.move]}\n\n`
        lastMove = c.move
      }
      md += card(c)
    }
  }

  const dir = join(process.cwd(), 'output', 'allyship-deck')
  mkdirSync(dir, { recursive: true })
  const out = join(dir, 'allyship-cards-review.md')
  writeFileSync(out, md, 'utf8')
  console.log(`OK wrote ${out} (${authored.length} cards)`)
}

main()
