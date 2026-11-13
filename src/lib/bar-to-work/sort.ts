/**
 * BAR-to-work, slice one (six-faces-council .specify/specs/ouroboros-intake/runs/btw-slice-look-1/seed.yaml).
 *
 * A BAR is freeform and never repeats. What is fixed is the process that metabolizes it into work: eight work types and
 * an ordered list of rules that reads the BAR's own words and its stored facts and names one type. The first rule that
 * matches wins; the rule's name travels with the answer so Ouroboros and the no-model fallback can follow the same
 * steps. Pure: no model call, no clock.
 */

export const WORK_TYPES = [
  'recipe_knob', 'steer_redraw', 'mechanic_proof', 'build_from_spec',
  'spec_from_bar', 'new_look_round', 'writing_round', 'personal_ops',
] as const
export type WorkType = (typeof WORK_TYPES)[number]

export const WORK_TYPE_LABEL: Record<WorkType, string> = {
  recipe_knob: 'Recipe knob',
  steer_redraw: 'Steer redraw',
  mechanic_proof: 'Mechanic proof',
  build_from_spec: 'Build from a merged spec',
  spec_from_bar: 'Spec from a BAR',
  new_look_round: 'New look round',
  writing_round: 'Writing round',
  personal_ops: 'Personal ops',
}

/** Types a lane can take in slice one. Personal ops is named now and built in the next slice. */
export const BUILT_TYPES: readonly WorkType[] = WORK_TYPES.filter(t => t !== 'personal_ops')

export type SortInput = {
  title: string
  description: string
  /** CustomBar.type, e.g. 'vibe', 'quest', 'insight'. Read but never decisive alone. */
  type?: string | null
  /** True when a merged spec already covers this BAR (a stored fact, never guessed from words). */
  hasMergedSpec?: boolean
}
export type Sorted = { type: WorkType; rule: string }

const has = (text: string, re: RegExp) => re.test(text)

/** Ordered rules. Each is [name, test, type]. Keep them plain so a person can read why a BAR landed where it did. */
const RULES: ReadonlyArray<readonly [string, (t: string, i: SortInput) => boolean, WorkType]> = [
  ['merged-spec-exists', (_t, i) => i.hasMergedSpec === true, 'build_from_spec'],
  ['ops-words', t => has(t, /\b(invoice|taxes|tax return|insurance|dentist|doctor|appointment|calendar|email|inbox|reply to|call (back|him|her|them)|book(ing)? (a|the)|pay (the|my)|bill|renew|schedule (a|the)|errand|paperwork|bank|rent)\b/), 'personal_ops'],
  ['knob-words', t => has(t, /\b(knob|recipe|tweak|dial|turn (it )?(up|down)|too (fast|slow|big|small|loud)|speed|scale|sway|strength)\b/), 'recipe_knob'],
  ['redraw-words', t => has(t, /\b(swap|recolou?r|redraw|re-draw|wrong colou?r|change the colou?r|move the|make it (bigger|smaller|brighter|darker))\b/), 'steer_redraw'],
  ['look-words', t => has(t, /\b(draw|picture|illustrat|concept art|look for|what it looks like|sprite|portrait|scene|asset|model of)\b/), 'new_look_round'],
  ['writing-words', t => has(t, /\b(write|story|stories|lines of|dialogue|chapter|essay|voice|copy for|script|poem|letter to)\b/), 'writing_round'],
  ['mechanic-words', t => has(t, /\b(mechanic|rules?|move|turn order|score|reward|cost|progress(ion)?|level up|unlock|vibeulon|mana|cooldown)\b/), 'mechanic_proof'],
]

/** The fallback is the slice's own door: an idea with no other mark becomes a spec first, then a build. */
export const DEFAULT_RULE: Sorted = { type: 'spec_from_bar', rule: 'default-spec-first' }

export function sortBar(input: SortInput): Sorted {
  const text = `${input.title}\n${input.description}`.toLowerCase()
  for (const [rule, test, type] of RULES) if (test(text, input)) return { type, rule }
  return DEFAULT_RULE
}
