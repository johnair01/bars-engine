/**
 * Single source of truth for Cultivation Sifu (NPC guides) ↔ six Game Master faces.
 * Used by `/shadow/321` (Shadow321Runner) and `/wiki/cultivation-sifu`.
 *
 * If you change copy here, update `backend/app/agents/_lore.py` to match (Python agents).
 */
import type { GameMasterFace } from '@/lib/quest-grammar/types'

export type NPCGuide = {
  id: string
  name: string
  face: GameMasterFace
  tagline: string
  description: string
  /** Tailwind text color class for titles/accent in UI */
  color: string
}

export const NPC_GUIDES: NPCGuide[] = [
  {
    id: 'vorm',
    name: 'Vorm the Master Architect',
    face: 'architect',
    tagline: 'Precision for the Forge',
    description:
      'The ancient sys-admin of the Silver City. He sees the world as logic and systems waiting to be solved.',
    color: 'text-orange-400',
  },
  {
    id: 'ignis',
    name: 'Ignis the Unbroken',
    face: 'challenger',
    tagline: 'Passion through Friction',
    description: 'The gardener of fire. He does not coddle; he tests your commitment to the flame.',
    color: 'text-red-400',
  },
  {
    id: 'aurelius',
    name: 'Aurelius the Law-Giver',
    face: 'regent',
    tagline: 'Balance at Noon',
    description:
      'The architect of fair exchange. He believes order is the only shield against chaos.',
    color: 'text-amber-400',
  },
  {
    id: 'sola',
    name: 'Sola the Heart of Lamenth',
    face: 'diplomat',
    tagline: 'Beauty in Tragedy',
    description:
      'The finder of meaning. She translates the poignance of existence into relational power.',
    color: 'text-emerald-400',
  },
  {
    id: 'kaelen',
    name: 'Kaelen the Moon-Caller',
    face: 'shaman',
    tagline: 'Spontaneous Growth',
    description:
      'The mythic bridge-builder. He speaks in riddles of growth and joy, inviting you to descend.',
    color: 'text-purple-400',
  },
  {
    id: 'witness',
    name: 'The Witness',
    face: 'sage',
    tagline: 'The Meta-Observer',
    description:
      'The one who has worn every mask. The Sage synthesizes the whole world into a single choice.',
    color: 'text-indigo-400',
  },
]
