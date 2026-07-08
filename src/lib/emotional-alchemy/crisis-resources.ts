/**
 * Emotional Alchemy — crisis resources (hostile-review S2).
 *
 * The safety surface must not be US-only or hardcoded. This is the one place
 * crisis contacts live. Region-aware selection is a later step (gap G10); until
 * then every player sees the US line AND an always-valid local-emergency
 * fallback, so no one is stranded. No invented hotline numbers — only the US
 * 988, the universally-valid "local emergency number", and a neutral pointer to
 * a directory.
 */

export interface CrisisResource {
  label: string
  contact: string
  note?: string
}

export const CRISIS_US: CrisisResource = {
  label: '988 Suicide & Crisis Lifeline',
  contact: 'Call or text 988',
  note: '24/7 in the US',
}

export const CRISIS_INTERNATIONAL: CrisisResource = {
  label: 'Outside the US',
  contact: 'Your local emergency number',
  note: 'Find a crisis line at findahelpline.com',
}

/**
 * Crisis resources to show. `region` is accepted for the future region-aware
 * step; today it always returns the US line + the international fallback.
 */
export function crisisResources(_region?: string): CrisisResource[] {
  return [CRISIS_US, CRISIS_INTERNATIONAL]
}
