#!/usr/bin/env npx tsx
/**
 * Deck Template Audit — structural validation + style-guide checks + review output.
 *
 * Validates card content against CARD_STYLE_GUIDE.md and prints a human-readable
 * summary. The --review flag writes a structured markdown file for agent editorial
 * passes. The --output flag saves to a specified path.
 *
 * Style guide: .specify/specs/deck-card-move-grammar/CARD_STYLE_GUIDE.md
 *
 * Usage:
 *   npx tsx scripts/audit-deck-templates.ts
 *   npx tsx scripts/audit-deck-templates.ts --category archetype
 *   npx tsx scripts/audit-deck-templates.ts --key nation:lamenth
 *   npx tsx scripts/audit-deck-templates.ts --validate-only
 *   npx tsx scripts/audit-deck-templates.ts --review
 *   npx tsx scripts/audit-deck-templates.ts --review --output .specify/specs/deck-card-move-grammar/DECK_REVIEW.md
 */

import { writeFileSync } from 'fs'

// Register all starter templates (side-effect imports)
import '../src/lib/deck-templates/starters/index'
import { getAllTemplates, getTemplatesByCategory } from '../src/lib/deck-templates'
import type { DeckTemplate, CardSeedEntry, MoveType } from '../src/lib/deck-templates'

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const categoryFilter = args.includes('--category') ? args[args.indexOf('--category') + 1] : null
const keyFilter = args.includes('--key') ? args[args.indexOf('--key') + 1] : null
const validateOnly = args.includes('--validate-only')
const reviewMode = args.includes('--review')
const outputPath = args.includes('--output') ? args[args.indexOf('--output') + 1] : null

// ---------------------------------------------------------------------------
// Structural rules (hard constraints)
// ---------------------------------------------------------------------------

const EXPECTED_MOVE_TYPES: MoveType[] = ['wake_up', 'clean_up', 'grow_up', 'show_up']
const EXPECTED_CARDS_PER_MOVE = 2
const EXPECTED_TOTAL = EXPECTED_MOVE_TYPES.length * EXPECTED_CARDS_PER_MOVE

// ---------------------------------------------------------------------------
// Style-guide rules
// See: .specify/specs/deck-card-move-grammar/CARD_STYLE_GUIDE.md
// ---------------------------------------------------------------------------

// Body text: target 150–350 chars; hard bounds 80–600
const BODY_TARGET_MIN = 150
const BODY_TARGET_MAX = 350
const BODY_HARD_MIN = 80
const BODY_HARD_MAX = 600

// Hedging language the guide explicitly prohibits
const HEDGING_PATTERNS = [
  /\bmight want to\b/i,
  /\bconsider\b/i,
  /\bperhaps\b/i,
  /\byou could\b/i,
  /\byou may want\b/i,
  /\bmaybe\b/i,
]

// Title word count: 4–8 words
const TITLE_WORDS_MIN = 3
const TITLE_WORDS_MAX = 9

interface ValidationIssue {
  level: 'error' | 'warn' | 'style'
  rule: string   // which style-guide rule was violated (for agent citation)
  message: string
}

function validateDeck(deck: DeckTemplate): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // ── Structural ─────────────────────────────────────────────────────────────

  if (deck.cardSeed.length !== EXPECTED_TOTAL) {
    issues.push({
      level: 'error',
      rule: 'deck-arc/card-count',
      message: `Expected ${EXPECTED_TOTAL} cards, found ${deck.cardSeed.length}`,
    })
  }

  const byMoveType = new Map<string, number>()
  for (const card of deck.cardSeed) {
    byMoveType.set(card.moveType, (byMoveType.get(card.moveType) ?? 0) + 1)
  }
  for (const mt of EXPECTED_MOVE_TYPES) {
    const count = byMoveType.get(mt) ?? 0
    if (count !== EXPECTED_CARDS_PER_MOVE) {
      issues.push({
        level: 'error',
        rule: 'deck-arc/move-distribution',
        message: `move_type "${mt}": expected ${EXPECTED_CARDS_PER_MOVE}, found ${count}`,
      })
    }
  }

  if (deck.category === 'archetype' && !deck.key.startsWith('archetype:')) {
    issues.push({ level: 'warn', rule: 'variables/key-alignment', message: 'category=archetype but key missing "archetype:" prefix' })
  }
  if (deck.category === 'nation' && !deck.key.startsWith('nation:')) {
    issues.push({ level: 'warn', rule: 'variables/key-alignment', message: 'category=nation but key missing "nation:" prefix' })
  }

  // ── Per-card checks ─────────────────────────────────────────────────────────

  for (const card of deck.cardSeed) {
    const ref = `"${card.title}"`
    const body = card.bodyText.trim()
    const bodyLen = body.length

    // Structural: faceKey / archetypeKey / nationKey alignment
    if (card.faceKey !== null) {
      issues.push({ level: 'error', rule: 'variables/face-key', message: `${ref}: faceKey must be null for ${deck.category} decks` })
    }
    if (deck.category === 'archetype' && card.archetypeKey === null) {
      issues.push({ level: 'error', rule: 'variables/archetype-key', message: `${ref}: archetypeKey is null in archetype deck` })
    }
    if (deck.category === 'nation' && card.nationKey === null) {
      issues.push({ level: 'error', rule: 'variables/nation-key', message: `${ref}: nationKey is null in nation deck` })
    }

    // Structural: effect magnitude range
    if (card.playEffect.magnitude < 1 || card.playEffect.magnitude > 5) {
      issues.push({ level: 'warn', rule: 'variables/magnitude', message: `${ref}: magnitude ${card.playEffect.magnitude} outside range 1–5` })
    }
    if (card.playCost < 1 || card.playCost > 4) {
      issues.push({ level: 'warn', rule: 'variables/play-cost', message: `${ref}: playCost ${card.playCost} outside range 1–4` })
    }

    // Style: body length hard bounds
    if (bodyLen < BODY_HARD_MIN) {
      issues.push({ level: 'warn', rule: 'body-length/hard-min', message: `${ref}: body too short (${bodyLen} chars, hard min ${BODY_HARD_MIN})` })
    }
    if (bodyLen > BODY_HARD_MAX) {
      issues.push({ level: 'warn', rule: 'body-length/hard-max', message: `${ref}: body too long (${bodyLen} chars, hard max ${BODY_HARD_MAX})` })
    }

    // Style: body length target zone (soft warning)
    if (bodyLen >= BODY_HARD_MIN && bodyLen < BODY_TARGET_MIN) {
      issues.push({ level: 'style', rule: 'body-length/target', message: `${ref}: body below target (${bodyLen} chars, target ${BODY_TARGET_MIN}–${BODY_TARGET_MAX}) — may need more scaffolding` })
    }
    if (bodyLen > BODY_TARGET_MAX && bodyLen <= BODY_HARD_MAX) {
      issues.push({ level: 'style', rule: 'body-length/target', message: `${ref}: body above target (${bodyLen} chars, target ${BODY_TARGET_MIN}–${BODY_TARGET_MAX}) — may be over-explained` })
    }

    // Style: hedging language
    for (const pattern of HEDGING_PATTERNS) {
      if (pattern.test(body)) {
        issues.push({
          level: 'style',
          rule: 'voice/no-hedging',
          message: `${ref}: hedging language detected ("${pattern.source.replace(/\\b/g, '')}")`,
        })
        break // one flag per card is enough
      }
    }

    // Style: double-ask (more than one question mark — heuristic)
    const questionMarks = (body.match(/\?/g) ?? []).length
    if (questionMarks > 2) {
      issues.push({
        level: 'style',
        rule: 'voice/one-prompt',
        message: `${ref}: ${questionMarks} question marks — may be a double-ask (guide: one prompt per card)`,
      })
    }

    // Style: show_up must reference logging
    if (card.moveType === 'show_up' && !/\blog\b/i.test(body)) {
      issues.push({
        level: 'style',
        rule: 'show_up/log-required',
        message: `${ref}: show_up card has no "log" instruction — guide requires attestation`,
      })
    }

    // Style: community target should involve others in the prompt
    if (card.playEffect.target === 'community' && !/\b(who|person|people|someone|community|others|together|group|share|send|tell|write the bar)\b/i.test(body)) {
      issues.push({
        level: 'style',
        rule: 'variables/target-community',
        message: `${ref}: target=community but prompt doesn't visibly involve others`,
      })
    }

    // Style: title word count
    const titleWords = card.title.trim().split(/\s+/).length
    if (titleWords < TITLE_WORDS_MIN) {
      issues.push({ level: 'style', rule: 'title/word-count', message: `${ref}: title too short (${titleWords} words, min ${TITLE_WORDS_MIN})` })
    }
    if (titleWords > TITLE_WORDS_MAX) {
      issues.push({ level: 'style', rule: 'title/word-count', message: `${ref}: title too long (${titleWords} words, max ${TITLE_WORDS_MAX})` })
    }
  }

  return issues
}

// ---------------------------------------------------------------------------
// Console rendering (stdout mode)
// ---------------------------------------------------------------------------

function moveTypeLabel(mt: MoveType): string {
  return { wake_up: 'WAKE UP', clean_up: 'CLEAN UP', grow_up: 'GROW UP', show_up: 'SHOW UP' }[mt]
}

function effectSummary(card: CardSeedEntry): string {
  return `${card.playEffect.type} ×${card.playEffect.magnitude} → ${card.playEffect.target}`
}

function issueIcon(level: ValidationIssue['level']): string {
  return { error: '✗', warn: '⚠', style: '~' }[level]
}

function printCard(card: CardSeedEntry): void {
  console.log(`  [${moveTypeLabel(card.moveType)}] cost:${card.playCost}  (${effectSummary(card)})`)
  console.log(`    Title: ${card.title}`)
  const words = card.bodyText.trim().split(' ')
  let line = '    Body:  '
  const indent = '           '
  for (const word of words) {
    if (line.length + word.length + 1 > 100) { console.log(line); line = indent + word + ' ' }
    else { line += word + ' ' }
  }
  if (line.trim()) console.log(line)
  console.log()
}

function printDeck(deck: DeckTemplate, issues: ValidationIssue[]): void {
  const errors = issues.filter((i) => i.level === 'error')
  const warns = issues.filter((i) => i.level === 'warn')
  const styles = issues.filter((i) => i.level === 'style')

  console.log('━'.repeat(80))
  console.log(`DECK: ${deck.label}`)
  console.log(`  key:      ${deck.key}`)
  console.log(`  category: ${deck.category}`)
  console.log(`  cards:    ${deck.cardSeed.length}`)

  if (issues.length === 0) {
    console.log(`  status:   ✓ clean`)
  } else {
    if (errors.length) console.log(`  errors:   ${errors.map((i) => `✗ [${i.rule}] ${i.message}`).join('\n            ')}`)
    if (warns.length) console.log(`  warnings: ${warns.map((i) => `⚠ [${i.rule}] ${i.message}`).join('\n            ')}`)
    if (styles.length) console.log(`  style:    ${styles.map((i) => `~ [${i.rule}] ${i.message}`).join('\n            ')}`)
  }
  console.log()

  if (!validateOnly && !reviewMode) {
    for (const mt of EXPECTED_MOVE_TYPES) {
      for (const card of deck.cardSeed.filter((c) => c.moveType === mt)) {
        printCard(card)
      }
    }
  }
}

function printSummary(decks: DeckTemplate[], allIssues: Map<string, ValidationIssue[]>): void {
  const totalCards = decks.reduce((n, d) => n + d.cardSeed.length, 0)
  const byLevel = (level: ValidationIssue['level']) =>
    [...allIssues.values()].reduce((n, issues) => n + issues.filter((i) => i.level === level).length, 0)

  console.log('━'.repeat(80))
  console.log('SUMMARY')
  console.log(`  Decks:    ${decks.length}   Cards: ${totalCards}`)
  console.log(`  Errors:   ${byLevel('error')}`)
  console.log(`  Warnings: ${byLevel('warn')}`)
  console.log(`  Style:    ${byLevel('style')}   (style flags = guide violations, not structural errors)`)

  const byCategory = new Map<string, number>()
  for (const d of decks) byCategory.set(d.category, (byCategory.get(d.category) ?? 0) + 1)
  console.log('\n  By category:')
  for (const [cat, count] of [...byCategory.entries()].sort()) {
    console.log(`    ${cat.padEnd(14)} ${count} deck(s)`)
  }
}

// ---------------------------------------------------------------------------
// Review file renderer (markdown for agent annotation)
// ---------------------------------------------------------------------------

function buildReviewFile(decks: DeckTemplate[], allIssues: Map<string, ValidationIssue[]>): string {
  const lines: string[] = []
  const now = new Date().toISOString().split('T')[0]

  lines.push(`# Deck Template Review`)
  lines.push(``)
  lines.push(`**Generated**: ${now}`)
  lines.push(`**Style guide**: \`.specify/specs/deck-card-move-grammar/CARD_STYLE_GUIDE.md\``)
  lines.push(`**Decks**: ${decks.length}  **Cards**: ${decks.reduce((n, d) => n + d.cardSeed.length, 0)}`)
  lines.push(``)
  lines.push(`## How to Use This File`)
  lines.push(``)
  lines.push(`Each Face agent reviews from their specific editorial lens (see style guide §Agent Editorial Lenses).`)
  lines.push(`Add notes under each card's \`<!-- NOTES -->\` comment. Format:`)
  lines.push(``)
  lines.push(`\`\`\``)
  lines.push(`[Face: Challenger] The card is too comfortable. The shadow named ("giving too much") applies to`)
  lines.push(`any human, not specifically to this archetype. Suggest naming the Devoted Guardian's specific`)
  lines.push(`failure mode: caregiving as self-erasure even when the player is empty.`)
  lines.push(`\`\`\``)
  lines.push(``)
  lines.push(`Structural flags (✗ error, ⚠ warn) are generated by the script.`)
  lines.push(`Style flags (~ style) cite the specific style guide rule violated.`)
  lines.push(`Agent notes go below those flags.`)
  lines.push(``)
  lines.push(`---`)
  lines.push(``)

  for (const deck of decks) {
    const issues = allIssues.get(deck.key) ?? []
    const errors = issues.filter((i) => i.level === 'error')
    const warns = issues.filter((i) => i.level === 'warn')
    const styles = issues.filter((i) => i.level === 'style')

    lines.push(`## ${deck.label}`)
    lines.push(``)
    lines.push(`**Key**: \`${deck.key}\`  **Category**: ${deck.category}`)
    lines.push(``)

    if (errors.length) {
      lines.push(`**Errors (must fix):**`)
      for (const i of errors) lines.push(`- ✗ \`${i.rule}\` — ${i.message}`)
      lines.push(``)
    }
    if (warns.length) {
      lines.push(`**Warnings:**`)
      for (const i of warns) lines.push(`- ⚠ \`${i.rule}\` — ${i.message}`)
      lines.push(``)
    }
    if (styles.length) {
      lines.push(`**Style flags** *(cite rule from CARD_STYLE_GUIDE.md)*:`)
      for (const i of styles) lines.push(`- ~ \`${i.rule}\` — ${i.message}`)
      lines.push(``)
    }
    if (issues.length === 0) {
      lines.push(`*No automated flags.*`)
      lines.push(``)
    }

    lines.push(`<!-- DECK-LEVEL NOTES -->`)
    lines.push(`<!-- Agent notes on the deck's overall arc, pair structure, or identity coherence go here -->`)
    lines.push(``)

    for (const mt of EXPECTED_MOVE_TYPES) {
      const cards = deck.cardSeed.filter((c) => c.moveType === mt)
      if (!cards.length) continue

      const mtLabel = { wake_up: 'Wake Up', clean_up: 'Clean Up', grow_up: 'Grow Up', show_up: 'Show Up' }[mt]
      lines.push(`### ${mtLabel}`)
      lines.push(``)

      for (const card of cards) {
        const cardIssues = issues.filter((i) => i.message.includes(`"${card.title}"`))
        lines.push(`#### ${card.title}`)
        lines.push(``)
        lines.push(`> ${card.bodyText.trim().replace(/\n/g, ' ')}`)
        lines.push(``)
        lines.push(`*cost: ${card.playCost} · effect: ${effectSummary(card)} · body: ${card.bodyText.trim().length} chars*`)
        lines.push(``)
        if (cardIssues.length) {
          for (const i of cardIssues) {
            lines.push(`- ${issueIcon(i.level)} \`${i.rule}\` — ${i.message.replace(`"${card.title}": `, '')}`)
          }
          lines.push(``)
        }
        lines.push(`<!-- NOTES -->`)
        lines.push(``)
      }
    }

    lines.push(`---`)
    lines.push(``)
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  let decks = getAllTemplates()

  if (keyFilter) {
    decks = decks.filter((d) => d.key === keyFilter)
    if (!decks.length) { console.error(`No template found with key "${keyFilter}"`); process.exit(1) }
  } else if (categoryFilter) {
    decks = getTemplatesByCategory(categoryFilter as never)
    if (!decks.length) { console.error(`No templates for category "${categoryFilter}"`); process.exit(1) }
  }

  decks.sort((a, b) => {
    if (a.category === 'onboarding') return -1
    if (b.category === 'onboarding') return 1
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    return a.key.localeCompare(b.key)
  })

  const allIssues = new Map<string, ValidationIssue[]>()
  for (const deck of decks) allIssues.set(deck.key, validateDeck(deck))

  if (reviewMode) {
    const md = buildReviewFile(decks, allIssues)
    const dest = outputPath ?? '.specify/specs/deck-card-move-grammar/DECK_REVIEW.md'
    writeFileSync(dest, md, 'utf8')
    console.log(`✓ Review file written to ${dest}`)
    console.log(`  ${decks.length} decks · ${decks.reduce((n, d) => n + d.cardSeed.length, 0)} cards`)
    const styleCount = [...allIssues.values()].reduce((n, issues) => n + issues.filter((i) => i.level === 'style').length, 0)
    console.log(`  ${styleCount} style flags for agents to annotate`)
  } else {
    const label = keyFilter ? `key:${keyFilter}` : categoryFilter ? `category:${categoryFilter}` : 'all templates'
    console.log(`\n${'═'.repeat(80)}`)
    console.log(`Deck Template Audit — ${label}`)
    console.log(`Style guide: .specify/specs/deck-card-move-grammar/CARD_STYLE_GUIDE.md`)
    console.log(`${'═'.repeat(80)}\n`)

    for (const deck of decks) printDeck(deck, allIssues.get(deck.key) ?? [])
    printSummary(decks, allIssues)
    console.log()

    const hasErrors = [...allIssues.values()].some((issues) => issues.some((i) => i.level === 'error'))
    process.exit(hasErrors ? 1 : 0)
  }
}

main()
