/**
 * Allyship Deck — glossary data (pure).
 *
 * The deep-linkable dictionary of every recurring term that appears on a card:
 * the 5 Moves, 6 Operations (faces), 4 Domains, 5 Channels/Capabilities, the
 * five output BARs, the three alchemy operations, and a few cross-cutting
 * concepts (charge, altitude, stage).
 *
 * Most definitions are derived verbatim from the canonical arrays in
 * `move-library.ts` so the glossary can never drift from the deck grammar. Only
 * the terms that have no existing prose (output BARs, transcend/translate/
 * neutralize, altitude, stage, charge) are authored here.
 *
 * No React, no DB, no fs — safe to import from server and client alike, exactly
 * like `card-visuals.ts` and `assemble.ts`. The `*TermId` helpers are the SINGLE
 * source of truth for anchor ids: both this module and the card link helpers in
 * `AllyshipCard` use them, so a card link and its glossary anchor can never
 * diverge.
 *
 * @see .specify/specs/allyship-deck-literacy/spec.md (Phase 1)
 */

import { MOVES, OPERATIONS, DOMAINS, CAPABILITIES } from './move-library'
import type {
  BasicMove,
  Operation,
  AllyshipDomain,
  Channel,
  OutputBar,
} from './types'

export type GlossaryCategory =
  | 'move'
  | 'operation'
  | 'domain'
  | 'channel'
  | 'bar'
  | 'alchemy'
  | 'concept'

export interface GlossaryTerm {
  /** Stable slug — the `#anchor` on /deck/glossary and the card link target. */
  id: string
  term: string
  category: GlossaryCategory
  /** One- to three-sentence plain definition. */
  definition: string
  /** Optional secondary line (the canonical question / essence / statement). */
  also?: string
  /** Ids of related terms to cross-link. */
  related?: string[]
}

// ── Id helpers — the single source of truth for anchors ──────────────────────

export const moveTermId = (m: BasicMove): string => m.replace(/_/g, '-')
export const operationTermId = (op: Operation): string => op
export const channelTermId = (c: Channel): string => c
export const barTermId = (b: OutputBar): string => `${b}-bar`

const DOMAIN_TERM_ID: Record<AllyshipDomain, string> = {
  GATHERING_RESOURCES: 'gather-resources',
  RAISE_AWARENESS: 'raise-awareness',
  DIRECT_ACTION: 'direct-action',
  SKILLFUL_ORGANIZING: 'skillful-organizing',
}
export const domainTermId = (d: AllyshipDomain): string => DOMAIN_TERM_ID[d]

/** The href a card term links to. */
export const glossaryHref = (id: string): string => `/deck/glossary#${id}`

// ── Authored copy for terms with no existing prose ───────────────────────────

/** Output BARs — one per Basic Move; the move-library has only the type, not prose. */
const BAR_DEFS: Record<OutputBar, { move: string; definition: string }> = {
  awareness: { move: 'Wake Up', definition: 'A clear naming of what is actually happening, before you react to it.' },
  experience: { move: 'Open Up', definition: 'The felt sense of a charge, received rather than fled — the raw material every later move works on.' },
  insight: { move: 'Clean Up', definition: 'The move or story that was missing, now seen — a charge transformed into understanding.' },
  wisdom: { move: 'Grow Up', definition: "A capability you've actually developed, not just understood — who you've become." },
  artifact: { move: 'Show Up', definition: 'The concrete thing you create or do in the world. The move, made real.' },
}

const ALCHEMY: GlossaryTerm[] = [
  {
    id: 'transcend',
    term: 'Transcend',
    category: 'alchemy',
    definition: 'Let a charge ripen and rise on its own terms — include it in something larger instead of fixing or fighting it.',
    related: ['translate', 'neutralize', 'clean-up'],
  },
  {
    id: 'translate',
    term: 'Translate',
    category: 'alchemy',
    definition: 'Move a charge from one channel to another (for example, fear → agency) so its energy becomes usable.',
    related: ['transcend', 'neutralize', 'clean-up'],
  },
  {
    id: 'neutralize',
    term: 'Neutralize',
    category: 'alchemy',
    definition: 'Discharge a charge cleanly so it stops driving you — without dumping it on anyone else.',
    related: ['transcend', 'translate', 'clean-up'],
  },
]

const CONCEPTS: GlossaryTerm[] = [
  {
    id: 'charge',
    term: 'Charge',
    category: 'concept',
    definition: 'Emotional energy that wants to move. The deck metabolizes charge into BARs; every stuck feeling is a capability gone offline, not a problem to delete.',
    related: ['bar', 'capability'],
  },
  {
    id: 'bar',
    term: 'BAR',
    category: 'concept',
    definition: 'The unit of creative output a move produces. The deck turns a charge into a BAR; each of the five moves makes a different kind.',
    related: ['awareness-bar', 'experience-bar', 'insight-bar', 'wisdom-bar', 'artifact-bar'],
  },
  {
    id: 'capability',
    term: 'Capability',
    category: 'concept',
    definition: 'What a feeling restores access to: agency, connection, exploration, rest, or participation. A move’s real goal is to bring a capability back online.',
    related: ['fire', 'water', 'metal', 'earth', 'wood'],
  },
  {
    id: 'altitude',
    term: 'Altitude',
    category: 'concept',
    definition: 'How satisfied or intense a card reads, shown by its border: dissatisfied (thin, no glow) → neutral → satisfied (full border, glowing).',
  },
  {
    id: 'stage',
    term: 'Stage',
    category: 'concept',
    definition: 'A card’s density and maturity: seed (a collapsed preview) → growing (full detail) → composted (done, faded back into the soil).',
  },
]

// ── The assembled glossary ───────────────────────────────────────────────────

function buildGlossary(): GlossaryTerm[] {
  const moves: GlossaryTerm[] = MOVES.map((m) => ({
    id: moveTermId(m.key),
    term: m.label,
    category: 'move',
    definition: `${m.purpose}. Produces a ${m.outputBar} BAR.`,
    also: `Asks: “${m.question}”`,
    related: [barTermId(m.outputBar)],
  }))

  const operations: GlossaryTerm[] = OPERATIONS.map((op) => ({
    id: operationTermId(op.key),
    term: op.label,
    category: 'operation',
    definition: `${op.verb}. Every move can be performed through this face.`,
    also: `Asks: “${op.essence}”`,
  }))

  const domains: GlossaryTerm[] = DOMAINS.map((d) => ({
    id: domainTermId(d.key),
    term: d.label,
    category: 'domain',
    definition: `The allyship context of ${d.lens}.`,
  }))

  const channels: GlossaryTerm[] = CAPABILITIES.map((c) => ({
    id: channelTermId(c.channel),
    term: `${c.channelLabel} — ${cap(c.capability)}`,
    category: 'channel',
    definition: `When ${c.channelLabel} resolves from ${c.dissatisfied} to ${c.satisfaction}, you restore the capability: “${c.statement}”`,
    related: ['capability'],
  }))

  const bars: GlossaryTerm[] = (Object.keys(BAR_DEFS) as OutputBar[]).map((b) => ({
    id: barTermId(b),
    term: `${cap(b)} BAR`,
    category: 'bar',
    definition: `The BAR made by ${BAR_DEFS[b].move}. ${BAR_DEFS[b].definition}`,
    related: ['bar'],
  }))

  return [...moves, ...operations, ...domains, ...channels, ...bars, ...ALCHEMY, ...CONCEPTS]
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export const GLOSSARY: GlossaryTerm[] = buildGlossary()

/** Display order + labels for the glossary's grouped sections. */
export const CATEGORY_ORDER: GlossaryCategory[] = [
  'move',
  'operation',
  'domain',
  'channel',
  'bar',
  'alchemy',
  'concept',
]

export const CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  move: 'The 5 Moves',
  operation: 'The 6 Faces (Operations)',
  domain: 'The 4 Domains',
  channel: 'The 5 Channels',
  bar: 'Output BARs',
  alchemy: 'Alchemy',
  concept: 'Core Concepts',
}

/** Look up a single term by its anchor id. */
export function getGlossaryTerm(id: string): GlossaryTerm | undefined {
  return GLOSSARY.find((t) => t.id === id)
}
