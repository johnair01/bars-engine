import { newId } from './constellation'
import {
  ELEMENTS, MAX_TEXT_LENGTH, OUTCOME_KINDS,
  type BarPracticeLink, type Element, type ElementalEmber, type OutcomeKind, type PracticeContext,
} from './types'

export type DojoRoute = 'learn' | 'alive' | 'make' | 'bar'

export type DojoEntryChoice = { route: DojoRoute; title: string; blurb: string; prompt?: string }

/** The four doorways. “Work a BAR” appears only for a player who has BARs. */
export function entryChoices(opts: { barCount: number }): DojoEntryChoice[] {
  const choices: DojoEntryChoice[] = [
    { route: 'learn', title: 'Learn Thought Strings', blurb: 'A safe practice wall. Nothing you do here is kept.' },
    { route: 'alive', title: 'Something alive now', blurb: 'A feeling, friction, question or vague charge. No BAR needed.',
      prompt: 'What feels alive, sticky, charged, or worth noticing?' },
    { route: 'make', title: 'Make something', blurb: 'A hope, invitation, project or change you might create.',
      prompt: 'What would you like to make, tend, invite, or change?' },
  ]
  if (opts.barCount > 0) choices.push({ route: 'bar', title: 'Work a BAR', blurb: 'Practice with one of your BARs as the context.' })
  return choices
}

/** The current mode is always named on screen. */
export function modeLabel(ctx: PracticeContext, barTitle?: string): string {
  switch (ctx.kind) {
    case 'tutorial': return 'Learning constellation'
    case 'seed': return 'Private practice'
    case 'incipient_bar': return 'Drafting a BAR'
    case 'bar': return `Working: ${barTitle?.trim() || 'your BAR'}`
  }
}

export type ExitId = 'discard' | 'settle' | 'keep_drafting' | 'plant_bar' | 'return_nook' | 'return_bar' | 'restart' | 'make_mine'

export type ExitOption = { id: ExitId; label: string }

/** Every mode offers a way out. No exit is worded as passing, completing, healing or failing. */
export function exitsFor(ctx: PracticeContext): ExitOption[] {
  switch (ctx.kind) {
    case 'tutorial':
      return [{ id: 'restart', label: 'Start the wall over' }, { id: 'make_mine', label: 'Make this mine' }, { id: 'return_nook', label: 'Return to Nook' }]
    case 'seed':
      return [{ id: 'discard', label: 'Discard this practice' }, { id: 'settle', label: 'Keep as a private practice seed' },
        { id: 'plant_bar', label: 'Plant a BAR from this' }, { id: 'return_nook', label: 'Return to Nook' }]
    case 'incipient_bar':
      return [{ id: 'keep_drafting', label: 'Keep drafting privately' }, { id: 'plant_bar', label: 'Plant a BAR' },
        { id: 'discard', label: 'Discard the draft' }, { id: 'return_nook', label: 'Return to Nook' }]
    case 'bar':
      return [{ id: 'discard', label: 'Discard uncommitted draft' }, { id: 'settle', label: 'Settle for now' },
        { id: 'return_bar', label: 'Return to BAR' }, { id: 'return_nook', label: 'Return to Nook' }]
  }
}

/** The only fields of a BAR the dojo may show. Raw private reflection text never crosses this line. */
export function barContext(bar: { id: string; title: string; emotionalAlchemyTag?: string | null }) {
  const tag = bar.emotionalAlchemyTag?.trim().toLowerCase()
  const element = ELEMENTS.find(e => e === tag)
  return { id: bar.id, title: bar.title, ...(element ? { element } : {}) }
}

export type Arrival = { intention?: string; platform?: string[]; spiritId?: string }

/** The arrival screen gates nothing: empty is valid. Intention and platform are trimmed; a platform is at most three words. */
export function cleanArrival(a: Arrival): Arrival {
  const intention = a.intention?.trim().slice(0, MAX_TEXT_LENGTH)
  const platform = (a.platform ?? []).map(w => w.trim()).filter(Boolean).slice(0, 3)
  return { ...(intention ? { intention } : {}), ...(platform.length ? { platform } : {}), ...(a.spiritId ? { spiritId: a.spiritId } : {}) }
}

export const SOURCE_KIND = { seed: 'practice_seed', incipient_bar: 'incipient_bar', bar: 'bar' } as const

/**
 * A placeholder ember, offered only after the player explicitly settles or returns a practice. A tutorial context has
 * no ember: the type of `ctx` here leaves it out, and the runtime check keeps callers honest.
 */
export function makeEmber(opts: {
  ctx: PracticeContext; sourceId: string; settled: boolean; intensity?: number; element?: Element; ingredients?: string[]
}): ElementalEmber {
  const { ctx } = opts
  if (ctx.kind === 'tutorial') throw new Error('A learning constellation makes no embers.')
  if (!opts.settled) throw new Error('An ember is made after you settle or return a practice.')
  const intensity = [1, 2, 3].includes(opts.intensity ?? 1) ? ((opts.intensity ?? 1) as 1 | 2 | 3) : 1
  return {
    id: newId('ember'), sourceKind: SOURCE_KIND[ctx.kind], sourceId: opts.sourceId, intensity, status: 'held',
    ...(opts.element && ELEMENTS.includes(opts.element) ? { element: opts.element } : {}),
    selectedIngredients: (opts.ingredients ?? []).map(s => s.trim()).filter(Boolean).slice(0, 12),
  }
}

/** One selected outcome returns to the BAR's practice link. Nothing else about the constellation travels with it. */
export function returnOutcome(link: BarPracticeLink, kind: OutcomeKind, summary: string, now = new Date().toISOString()): BarPracticeLink {
  if (!OUTCOME_KINDS.includes(kind)) throw new Error('Unknown outcome kind.')
  const text = summary.trim()
  if (!text) throw new Error('Say the outcome in a sentence.')
  return { ...link, selectedOutcomes: [...link.selectedOutcomes, { kind, summary: text.slice(0, MAX_TEXT_LENGTH), createdAt: now }] }
}
