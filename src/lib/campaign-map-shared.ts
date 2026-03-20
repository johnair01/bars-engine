/**
 * Campaign map — shared types & labels (no DB). Safe for client components.
 */

import type { AllyshipDomain } from '@/lib/kotter'

export const CAMPAIGN_MAP_PHASE_1_LABEL = 'Opening Momentum'

export const CAMPAIGN_MAP_PHASE_1_DESCRIPTION =
  'The residency has begun. Players are gathering resources, organizing collaborators, raising awareness, and testing the early structure of the game.'

export const CAMPAIGN_MAP_DOMAINS: readonly AllyshipDomain[] = [
  'GATHERING_RESOURCES',
  'SKILLFUL_ORGANIZING',
  'RAISE_AWARENESS',
  'DIRECT_ACTION',
] as const

export const CAMPAIGN_MAP_DOMAIN_LABEL: Record<AllyshipDomain, string> = {
  GATHERING_RESOURCES: 'Gather Resources',
  SKILLFUL_ORGANIZING: 'Skillful Organizing',
  RAISE_AWARENESS: 'Raise Awareness',
  DIRECT_ACTION: 'Direct Action',
}

export function defaultAllyshipDomainForQuest(domain: string | null | undefined): AllyshipDomain {
  if (
    domain === 'GATHERING_RESOURCES' ||
    domain === 'SKILLFUL_ORGANIZING' ||
    domain === 'RAISE_AWARENESS' ||
    domain === 'DIRECT_ACTION'
  ) {
    return domain
  }
  return 'GATHERING_RESOURCES'
}

export type CampaignPhaseHeader = {
  campaignName: string
  phase: string
  phaseDescription: string
}

export type DomainRegionCount = {
  domain: AllyshipDomain
  label: string
  questCount: number
  activePlayerCount: number
}

export type FieldActivityIndicators = {
  barCount: number
  completionCount: number
  activePlayerCount: number
  fundingProgress?: number
  /** Optional heuristic line (FR10) — informational only; does not gate gameplay. */
  emergentHint?: string
}

/** Derive a single qualitative field signal from counts (spec: informational heuristics). */
export function computeEmergentFieldHint(args: {
  barCount: number
  completionCount: number
  activePlayerCount: number
}): string | undefined {
  const { barCount, completionCount, activePlayerCount } = args
  if (barCount === 0 && completionCount === 0 && activePlayerCount === 0) {
    return 'Quiet field — early residency; first contributions will show here.'
  }
  if (completionCount >= Math.max(3, barCount * 2)) {
    return 'Completion energy — campaign quests are finishing at a strong pace.'
  }
  if (barCount >= Math.max(5, completionCount * 3 + 1)) {
    return 'Rich capture — many BARs; room for more Show Up completions to match the charge.'
  }
  if (activePlayerCount >= 10 && completionCount < activePlayerCount) {
    return 'Many contributors active — a coordination-friendly moment in the field.'
  }
  return undefined
}
