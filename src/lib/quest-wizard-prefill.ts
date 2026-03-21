'use client'
/**
 * Client-side handoff from 321 → Quest Wizard (sessionStorage).
 * Same-origin only; cleared after consume. See flow-321-iching-quest-wizard spec.
 */

import type { Metadata321, Phase3Taxonomic } from '@/lib/quest-grammar'
import type { UnpackingAnswers } from '@/lib/quest-grammar/types'
import type { Shadow321NameFields } from '@/lib/shadow321-name-resolution'

export const QUEST_WIZARD_PREFILL_321_KEY = 'bars_quest_wizard_prefill_321'

/** Human-readable lines for the wizard UI only — not auto-mapped into quest title/description. */
export type QuestWizard321DisplayHints = {
  /** Face It — what you're carrying */
  chargeLine: string
  /** Mask / presence label */
  maskPresence: string
  /** Aligned move (Wake Up, etc.) */
  alignedAction: string
  /** Be It — what shifts */
  integrationShift?: string
}

export type QuestWizardPrefill321V1 = {
  version: 1
  metadata: Metadata321
  phase2: UnpackingAnswers & { alignedAction?: string }
  phase3: Phase3Taxonomic
  shadow321Name?: Shadow321NameFields | null
  /** Shown in a reference panel; server still uses phase2/phase3 JSON for linkage */
  displayHints?: QuestWizard321DisplayHints
}

export function stashQuestWizardPrefillFrom321(payload: QuestWizardPrefill321V1): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(QUEST_WIZARD_PREFILL_321_KEY, JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
}

export function consumeQuestWizardPrefillFrom321(): QuestWizardPrefill321V1 | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(QUEST_WIZARD_PREFILL_321_KEY)
    if (!raw) return null
    sessionStorage.removeItem(QUEST_WIZARD_PREFILL_321_KEY)
    const parsed = JSON.parse(raw) as QuestWizardPrefill321V1
    if (parsed?.version !== 1 || !parsed.metadata) return null
    return parsed
  } catch {
    return null
  }
}
