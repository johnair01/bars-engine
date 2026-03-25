/**
 * ARDS Register 1 + 4 coherence: each lobby nation key maps to one Wuxing element.
 * Portrait `nation_body` / walk tints should align with `ELEMENT_TOKENS[element].frame`.
 * @see docs/SEMANTIC_REGISTERS.md
 */

import type { ElementKey } from '@/lib/ui/card-tokens'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'

/** Canonical nation slug → element (five nations + lobby trading floor). */
export const NATION_KEY_TO_ELEMENT: Record<string, ElementKey> = {
  pyrakanth: 'fire',
  lamenth: 'water',
  virelune: 'wood',
  argyra: 'metal',
  meridia: 'earth',
}

/** Element frame hex for a nation key, or undefined if unknown. */
export function getNationFrameHex(nationKey: string): string | undefined {
  const el = NATION_KEY_TO_ELEMENT[nationKey]
  return el ? ELEMENT_TOKENS[el].frame : undefined
}

export function getElementForNationKey(nationKey: string): ElementKey | null {
  return NATION_KEY_TO_ELEMENT[nationKey] ?? null
}
