/**
 * Story Intro Packet — Lore-immersive intro for chained initiation.
 * Pure compiler; no AI, no Prisma. Uses story-world copy from content/onboarding-story-intro.md.
 * @see .specify/specs/lore-immersive-onboarding/spec.md
 */

import type { SerializableQuestPacket, QuestNode, SegmentVariant } from './types'

/** Story-world intro beats. Align with content/onboarding-story-intro.md. */
const STORY_INTRO_BEATS: { id: string; text: string }[] = [
  {
    id: 'intro_orientation',
    text: '**Welcome to the Heaven sect.** The sect is a school of cultivation on a mountain above the clouds. It takes in people who have left the frozen settlements below. You left one too. That is why its gate opened for you.',
  },
  {
    id: 'intro_rising',
    text: '**Cultivation here means training your emotional energy.** Every feeling carries a charge. In Calrunia that charge takes shape as spirits. A trained student can turn a stuck feeling into a clear next step. The same skill works on the stuck moments of your own week.',
  },
  {
    id: 'intro_tension',
    text: '**Six Elders teach in the sect.** Each Elder teaches one face of the game master. The Shaman reads feeling. The Architect builds structure. The Challenger tests the edge. The Regent keeps the rules. The Diplomat brings people together. The Sage sees the whole pattern.',
  },
  {
    id: 'intro_integration',
    text: '**You start as an Initiate, the first of six ranks.** First you shape your character. Then you learn the basic moves, each one a short practice you can use today. Last, you choose the Elder whose way fits you. You leave with a starter share of vibeulons, the sect\'s coin of emotional energy.',
  },
]

export interface StoryIntroPacketInput {
  segment?: SegmentVariant
}

export function compileStoryIntroPacket(input: StoryIntroPacketInput = {}): SerializableQuestPacket {
  const { segment = 'player' } = input

  const nodes: QuestNode[] = []
  const ids = STORY_INTRO_BEATS.map((b) => b.id)

  const beatTypes = ['orientation', 'rising_engagement', 'tension', 'integration'] as const
  for (let i = 0; i < STORY_INTRO_BEATS.length; i++) {
    const beat = STORY_INTRO_BEATS[i]!
    const isLast = i === STORY_INTRO_BEATS.length - 1
    nodes.push({
      id: beat.id,
      beatType: beatTypes[i] ?? 'orientation',
      wordCountEstimate: 40,
      emotional: { channel: 'Neutrality', movement: 'translate' },
      text: beat.text,
      choices: isLast ? [] : [{ text: 'Continue', targetId: ids[i + 1]! }],
      anchors: i === 0 ? { goal: 'orientation' } : {},
    })
  }

  return {
    signature: {
      primaryChannel: 'Neutrality',
      dissatisfiedLabels: [],
      satisfiedLabels: [],
      movementPerNode: [],
      shadowVoices: [],
    },
    nodes,
    segmentVariant: segment,
    startNodeId: ids[0]!,
  }
}
