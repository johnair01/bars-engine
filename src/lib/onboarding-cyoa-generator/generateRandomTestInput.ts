/**
 * Onboarding CYOA Generator — Random Test Input
 *
 * Generates random unpacking + I Ching context for quest grammar validation.
 * Uses drawAlignedHexagram with empty context (pure random 1–64), generateRandomUnpacking,
 * and random nation/playbook from DB.
 * See .specify/specs/onboarding-cyoa-generator/spec.md
 */

import { db } from '@/lib/db'
import { drawAlignedHexagram } from '@/lib/iching-alignment'
import { getHexagramStructure } from '@/lib/iching-struct'
import {
  generateRandomUnpacking,
  getPlaybookPrimaryWave,
} from '@/lib/quest-grammar'
import type { IChingContext } from '@/lib/quest-grammar'
import type { ElementKey } from '@/lib/quest-grammar/elements'
import type { RandomTestInput } from './types'

const ELEMENT_KEYS: ElementKey[] = ['metal', 'water', 'wood', 'fire', 'earth']

/**
 * Generate random test input for quest grammar validation.
 * Random hexagram (1–64), random unpacking, random nation/playbook from DB.
 */
export async function generateRandomTestInput(): Promise<RandomTestInput> {
  const emptyContext = {
    kotterStage: null,
    nationName: null,
    playbookTrigram: null,
    activeFace: null,
    playedHexagramIds: [] as number[],
  }

  const hexagramId = await drawAlignedHexagram(emptyContext)

  const [hexagram, nations, playbooks] = await Promise.all([
    db.bar.findUnique({ where: { id: hexagramId } }),
    db.nation.findMany({ select: { id: true, element: true } }),
    db.playbook.findMany({ select: { id: true } }),
  ])

  const structure = getHexagramStructure(hexagramId)

  const ichingContext: IChingContext = {
    hexagramId,
    hexagramName: hexagram?.name ?? `Hexagram ${hexagramId}`,
    hexagramTone: hexagram?.tone ?? '',
    hexagramText: hexagram?.text ?? '',
    upperTrigram: structure.upper,
    lowerTrigram: structure.lower,
  }

  let nationId: string | null = null
  let playbookId: string | null = null
  let nationElement: ElementKey | undefined
  let playbookPrimaryWave: 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp' | undefined

  if (nations.length > 0) {
    const nation = nations[Math.floor(Math.random() * nations.length)]!
    nationId = nation.id
    if (
      nation.element &&
      ELEMENT_KEYS.includes(nation.element as ElementKey)
    ) {
      nationElement = nation.element as ElementKey
    }
  }

  if (playbooks.length > 0) {
    const playbook = playbooks[Math.floor(Math.random() * playbooks.length)]!
    playbookId = playbook.id
    playbookPrimaryWave = await getPlaybookPrimaryWave(playbookId)
  }

  const { unpackingAnswers, alignedAction } = generateRandomUnpacking({
    nationElement,
    playbookPrimaryWave,
  })

  return {
    unpackingAnswers,
    alignedAction,
    ichingContext,
    nationId,
    playbookId,
  }
}
