/**
 * Single registry for narrative template IDs spanning quest grammar, event domains, and modular CYOA.
 * @see .specify/specs/cyoa-build-contract-gm-faces/spec.md §3.3
 */

import type { EventProductionGrammar } from '@/lib/event-campaign/domains'

export const DEFAULT_MODULAR_COASTER_TEMPLATE_ID = 'clb-coaster-v0' as const

export const NARRATIVE_TEMPLATE_IDS = ['epiphany_bridge', 'kotter', 'modular_coaster'] as const
export type NarrativeTemplateId = (typeof NARRATIVE_TEMPLATE_IDS)[number]

export type QuestGrammarId = 'epiphany_bridge' | 'kotter'

export type ResolvedNarrativeTemplate =
  | { kind: 'quest_grammar'; questGrammar: QuestGrammarId }
  | { kind: 'event_grammar'; eventGrammar: EventProductionGrammar }
  | { kind: 'modular_cyoa'; modularTemplateId: string }

export function isNarrativeTemplateId(value: unknown): value is NarrativeTemplateId {
  return typeof value === 'string' && (NARRATIVE_TEMPLATE_IDS as readonly string[]).includes(value)
}

/**
 * Map a product-facing template id to the subsystem that implements it.
 */
export function resolveNarrativeTemplate(id: NarrativeTemplateId): ResolvedNarrativeTemplate {
  switch (id) {
    case 'epiphany_bridge':
      return { kind: 'quest_grammar', questGrammar: 'epiphany_bridge' }
    case 'kotter':
      return { kind: 'quest_grammar', questGrammar: 'kotter' }
    case 'modular_coaster':
      return { kind: 'modular_cyoa', modularTemplateId: DEFAULT_MODULAR_COASTER_TEMPLATE_ID }
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}
