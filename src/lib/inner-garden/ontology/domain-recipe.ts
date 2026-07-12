/**
 * Inner Garden — Domain Recipes.
 *
 * Lets the game answer: "what kind of BARs and which fruit must be metabolized to grow a
 * successful [domain] campaign?" It composes three EXISTING pieces:
 *   1. the Domain × Kotter matrix — the authored recipe (`STAGE_ACTIONS_BY_DOMAIN` /
 *      `getStageAction` in `@/lib/kotter`),
 *   2. move → fruit — a constant (fruit is `// fixed by move`; mirror of
 *      `@/lib/allyship-deck/move-library.ts:30-36`),
 *   3. the domain keystone — the native move / keystone fruit / deliverable (the
 *      DOMAIN_KEYSTONE table this file authors; gap §5.1 of the domain-recipes doc).
 *
 * Design docs:
 *   docs/handoffs/2026-07-12-inner-garden-domain-recipes.md
 *   docs/handoffs/2026-07-12-inner-garden-maturation-ontology.md
 *
 * Pure data + pure functions. No I/O, no render — tsx-testable.
 */
import { KOTTER_STAGES, getStageAction, type AllyshipDomain, type KotterStage } from '@/lib/kotter'

// --- axes ---

/** The 5 WAVE moves (HOW). */
export type BasicMove = 'wake_up' | 'open_up' | 'clean_up' | 'grow_up' | 'show_up'

/**
 * The durable ARTIFACT a move produces — the `OutputBar` banked to the Vault (WHAT the
 * metabolism yields). NOTE: this is DISTINCT from a plant's "fruit type," which is the
 * `allyshipDomain` (the 4 domains). An OutputBar is the move's artifact type, not the fruit.
 */
export type OutputBar = 'awareness' | 'experience' | 'insight' | 'wisdom' | 'artifact'

export type ElementKey = 'fire' | 'water' | 'wood' | 'metal' | 'earth'

/**
 * MOVE_FRUIT maps a move to its ARTIFACT TYPE (`OutputBar`) — the durable output banked to
 * the Vault. It is FIXED BY MOVE and domain-invariant — every campaign metabolizes all five.
 * DISTINCT from a plant's "fruit type," which is the `allyshipDomain` (the 4 domains): despite
 * the export name, this is a move → artifact-type map, not a move → fruit(domain) map.
 * Mirror of `allyship-deck/move-library.ts:30-36` (kept local to avoid heavy imports).
 */
export const MOVE_FRUIT: Record<BasicMove, OutputBar> = {
  wake_up: 'awareness',
  open_up: 'experience',
  clean_up: 'insight',
  grow_up: 'wisdom',
  show_up: 'artifact',
}

// --- the DOMAIN_KEYSTONE table (the one small registry the ontology was missing) ---

export interface DomainKeystone {
  label: string
  /** The domain's native WAVE move(s) — its signature metabolic act (MOVE_CELL_AFFINITY). */
  nativeMoves: BasicMove[]
  /** Keystone fruit = MOVE_FRUIT of the native move(s). */
  keystoneFruit: OutputBar[]
  /** Wuxing element (`allyship-domains.ts:22-27`). */
  element: ElementKey
  /** The outer-world deliverable (`show-up-primitives.ts:285-290`). */
  outerDeliverable: string
  /** WHERE essence (`domain-context.ts` DOMAIN_ESSENCE, condensed). */
  essence: string
}

export const DOMAIN_KEYSTONE: Record<AllyshipDomain, DomainKeystone> = {
  RAISE_AWARENESS: {
    label: 'Raise Awareness',
    nativeMoves: ['wake_up'],
    keystoneFruit: ['awareness'],
    element: 'metal',
    outerDeliverable: 'truth signal',
    essence: 'help people see what is possible',
  },
  GATHERING_RESOURCES: {
    label: 'Gathering Resources',
    nativeMoves: ['open_up', 'grow_up'],
    keystoneFruit: ['experience', 'wisdom'],
    element: 'earth',
    outerDeliverable: 'resource movement',
    essence: 'invite participation; marshal time, skills, and presence',
  },
  SKILLFUL_ORGANIZING: {
    label: 'Skillful Organizing',
    nativeMoves: ['clean_up'],
    keystoneFruit: ['insight'],
    element: 'wood',
    outerDeliverable: 'agreement structure',
    essence: 'build capacity for the whole; systems and processes',
  },
  DIRECT_ACTION: {
    label: 'Direct Action',
    nativeMoves: ['show_up'],
    keystoneFruit: ['artifact'],
    element: 'fire',
    outerDeliverable: 'intervention',
    essence: 'doing, and enabling others to do',
  },
}

// --- the composed recipe the game reads ---

export interface RecipeStage {
  stage: KotterStage
  kotterName: string
  /** Domain-specific stage action from the Domain × Kotter matrix. */
  action: string
}

export interface CampaignRecipe {
  domain: AllyshipDomain
  keystone: DomainKeystone
  /** The 8 Kotter stages, each with this domain's stage action. */
  stages: RecipeStage[]
  /** The Anchor (stage 8) action — what success looks like. */
  successAnchor: string
  /** A one-sentence human-readable answer to "what makes a successful [domain] campaign?". */
  answer: string
}

const ALL_STAGES: KotterStage[] = [1, 2, 3, 4, 5, 6, 7, 8]

/**
 * Compose the full recipe for a domain's campaign — the game's answer to
 * "what BARs and fruit must be metabolized to make a successful [domain] campaign?".
 */
export function describeCampaignRecipe(domain: AllyshipDomain): CampaignRecipe {
  const keystone = DOMAIN_KEYSTONE[domain]
  const stages: RecipeStage[] = ALL_STAGES.map(s => ({
    stage: s,
    kotterName: KOTTER_STAGES[s].name,
    action: getStageAction(s, domain),
  }))
  const successAnchor = stages[stages.length - 1]!.action
  const fruit = keystone.keystoneFruit.join(' / ')
  const moves = keystone.nativeMoves.join(' + ')
  const answer =
    `To grow a successful ${keystone.label} campaign, metabolize ${keystone.label}-tagged ` +
    `charges — leaning on ${moves} (keystone fruit: ${fruit}) — through the 8 Kotter stages, ` +
    `producing a ${keystone.outerDeliverable}, until "${successAnchor}".`
  return { domain, keystone, stages, successAnchor, answer }
}
