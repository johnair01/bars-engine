/**
 * ARDS Register 3 (Portrait) — shared CSS for conversation-scale faces.
 * Stack uses layered parts (Avatar.tsx); Register 3 crop/vignette matches spec:
 * `object-position: center 15%` + element-colored edge treatment.
 * @see docs/SEMANTIC_REGISTERS.md
 */

import type { CSSProperties } from 'react'

import type { ElementKey } from '@/lib/ui/card-tokens'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'

/** Stacked portrait layers: slight upward crop so the face reads in circular frames. */
export const REGISTER_PORTRAIT_IMG_CLASSES =
  'absolute inset-0 w-full h-full object-cover object-[center_15%]'

/** Ring + soft glow from element frame token (Register 1 palette). */
export function registerPortraitShellStyle(element: ElementKey): CSSProperties {
  const t = ELEMENT_TOKENS[element]
  return {
    boxShadow: `0 0 0 2px ${t.frame}, 0 0 14px ${t.glow}55`,
  }
}
