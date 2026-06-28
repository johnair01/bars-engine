/**
 * Allyship Deck — deterministic assembler (ADK Phase 1).
 * Generates the 120 move cards (5 moves × 6 operations × 4 domains) from the
 * canonical grammar, merges authored overrides, builds the instruction-card set
 * and the consult `problems` index. No AI, no DB. Pure function → AllyshipDeck.
 *
 * Spec: .specify/specs/allyship-deck/spec.md
 */

import type {
  AllyshipCard,
  AllyshipDeck,
  Capability,
  DeckProblem,
  InstructionCard,
  MoveCard,
} from './types'
import {
  AUTHORED,
  CAPABILITIES,
  DOMAINS,
  MOVES,
  OPERATIONS,
  SUBMOVES,
} from './move-library'

export const DECK_VERSION = '0.1.0'

function buildMoveCards(): MoveCard[] {
  const cards: MoveCard[] = []
  let seq = 0
  for (const m of MOVES) {
    for (const d of DOMAINS) {
      for (const op of OPERATIONS) {
        const sub = SUBMOVES[m.key][op.key]
        const id = `${m.abbr}-${d.abbr}-${op.key.toUpperCase()}`
        seq++

        const generated: MoveCard = {
          id,
          num: String(seq).padStart(3, '0'),
          kind: 'move',
          move: m.key,
          operation: op.key,
          domain: d.key,
          outputBar: m.outputBar,
          title: `${op.label} · ${m.label} · ${d.label}`,
          submovePrompt: `${sub.action}. ${sub.question}`,
          primaryQuestion: sub.question,
          campaignQuestion: `${m.campaignStem}, in ${d.label}? (${op.label}: ${op.essence})`,
          defaultSubject: 'self',
          optimizesFor: `${op.verb} in order to ${m.purpose.toLowerCase()} — in the context of ${d.lens}.`,
          forbiddenMoves: ['— author —'],
          failureModes: ['— author —'],
          remediation: `${sub.action} — in the context of ${d.lens}.`,
          capabilities: [],
          status: 'generated',
        }

        const override = AUTHORED[id]
        cards.push(override ? { ...generated, ...override, status: 'authored' } : generated)
      }
    }
  }
  return cards
}

function buildInstructionCards(): InstructionCard[] {
  const cards: InstructionCard[] = []
  const add = (topic: string, title: string, body: string, n: number) =>
    cards.push({ id: `INSTR-${topic.toUpperCase()}-${String(n).padStart(2, '0')}`, kind: 'instruction', topic, title, body })

  // How-to
  add('howto', 'What this deck is', 'A spellbook of allyship moves. Draw a card for inspiration, or consult deliberately to find the move that restores a capability you have lost access to.', 1)
  add('howto', 'How to draw', 'Shuffle and reveal one card. Read its question. Do its remediation — the small practice at the bottom. That is the whole move.', 2)
  add('howto', 'How to consult', 'Name your situation. Find the matching problem, or the capability that feels offline, and follow it to the cards that restore it.', 3)
  add('howto', 'Allyship for self vs others', 'Every move card reads two ways. Allyship for self: use the first question for your own inner work. Allyship for others: use the campaign question for a milestone, campaign, or relationship in service of someone else.', 4)
  add('howto', 'Reading a card', 'A card names an Operation (how you act), a Move (what kind of progress), and a Domain (the allyship context). The question opens it; the remediation closes it.', 5)
  add('howto', 'The BAR flow', 'The loop: a Charge moves through Wake Up (Awareness) → Open Up (Experience) → Clean Up (Insight) → Grow Up (Capacity) → Show Up (Artifact). Each move makes a BAR.', 6)
  add('howto', 'You are restoring capability', 'You are never trying to eliminate emotion. Every stuck feeling is a capability gone offline. The move restores access.', 7)

  // One per Basic Move
  MOVES.forEach((m, i) => add('move', `Move: ${m.label}`, `${m.purpose}. Ask: "${m.question}" Output: a ${m.outputBar} BAR.`, i + 1))
  // One per Operation
  OPERATIONS.forEach((op, i) => add('operation', `Operation: ${op.label}`, `${op.verb}. Ask: "${op.essence}" Every move passes through this operation — the faces are operations, not classes.`, i + 1))
  // One per Domain
  DOMAINS.forEach((d, i) => add('domain', `Domain: ${d.label}`, `The allyship context of ${d.lens}.`, i + 1))
  // One per Capability
  CAPABILITIES.forEach((c, i) => add('capability', `Capability: ${cap(c.capability)} (${c.channelLabel} → ${c.satisfaction})`, `When ${c.channelLabel} resolves from ${c.dissatisfied} to ${c.satisfaction}, you restore: "${c.statement}"`, i + 1))

  return cards
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Seed the consult index from documented pains → relevant cards. */
function buildProblems(moveCards: MoveCard[]): DeckProblem[] {
  const ids = (pred: (c: MoveCard) => boolean) => moveCards.filter(pred).map((c) => c.id)
  return [
    { id: 'fake-asking', label: 'I keep asking for help but nothing changes', cardIds: ids((c) => c.move === 'open_up' && c.domain === 'GATHERING_RESOURCES') },
    { id: 'defensive-feedback', label: 'I get defensive when challenged or given feedback', cardIds: ids((c) => c.move === 'clean_up' && (c.operation === 'challenger' || c.operation === 'sage')) },
    { id: 'overwhelm', label: "I'm overwhelmed — too much at once", cardIds: ids((c) => (c.move === 'wake_up' || c.move === 'clean_up') && (c.operation === 'shaman' || c.operation === 'architect')) },
    { id: 'cant-connect', label: "I feel distant — I can't connect", cardIds: ids((c) => c.move === 'open_up' && (c.operation === 'diplomat' || c.operation === 'sage')) },
    { id: 'care-cant-act', label: 'I care but I can\'t seem to act', cardIds: ids((c) => c.move === 'show_up' && (c.operation === 'challenger' || c.operation === 'regent')) },
    { id: 'running-a-campaign', label: 'I\'m running a campaign or milestone to help others', cardIds: ids((c) => c.move === 'show_up') },
  ]
}

export function assembleDeck(generatedAt = new Date().toISOString()): AllyshipDeck {
  const moveCards = buildMoveCards()
  const instructionCards = buildInstructionCards()
  const cards: AllyshipCard[] = [...moveCards, ...instructionCards]
  const authored = moveCards.filter((c) => c.status === 'authored').length

  return {
    deck_slug: 'allyship-deck',
    deck_name: 'The Allyship Deck — Mastering Allyship Moves',
    version: DECK_VERSION,
    generatedAt,
    theme: {
      // reuse card-token palette (element colors); refine in Phase 2/4
      fire: '#c2502e',
      water: '#2b8ca0',
      metal: '#9aa4b2',
      earth: '#b0863f',
      wood: '#5a9e4f',
      ink: '#211d17',
      paper: '#efe7d6',
      gold: '#c8a35a',
    },
    counts: { move: moveCards.length, instruction: instructionCards.length, authored, total: cards.length },
    problems: buildProblems(moveCards),
    cards,
  }
}

/** Capabilities available (for UI). */
export const CAPABILITY_KEYS: Capability[] = CAPABILITIES.map((c) => c.capability)

// ── Canonical card lookup ───────────────────────────────────────────────────
// Single source of truth for callers that need one card by id (role pages, the
// Crossing deck cards). Lives here — not in deck-bar.ts — because this module is
// client-safe (no next/headers, db, or fs), so client components can import it.

let _cardIndex: Map<string, AllyshipCard> | null = null

function cardIndex(): Map<string, AllyshipCard> {
  if (!_cardIndex) {
    _cardIndex = new Map(assembleDeck().cards.map((c) => [c.id, c]))
  }
  return _cardIndex
}

/** Look up any card (move or instruction) by its canonical id, e.g. "OPEN-GR-SHAMAN". */
export function getCardById(id: string): AllyshipCard | undefined {
  return cardIndex().get(id)
}

/** Look up a move card by id, narrowing out instruction cards. */
export function getMoveCardById(id: string): MoveCard | undefined {
  const card = cardIndex().get(id)
  return card?.kind === 'move' ? card : undefined
}
