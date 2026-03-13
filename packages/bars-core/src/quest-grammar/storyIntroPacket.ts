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
    text: '**The Conclave has convened.** Five nations. A heist at the Robot Oscars. Giant constructs powered by emotional energy. You\'re walking in mid-formation — and your participation matters.',
  },
  {
    id: 'intro_rising',
    text: '**Each nation channels a different emotional current:** Argyra\'s clarity, Pyrakanth\'s fire, Virelune\'s hope, Meridia\'s calm, Lamenth\'s flow. The crew is assembling. The heist needs every kind of pilot.',
  },
  {
    id: 'intro_tension',
    text: '**The stakes are real.** A corrupt force threatens construct technology. The Oscars bring the elite out of hiding — and something valuable is there for the taking. The gap between where we are and where we\'re going? That\'s the heist.',
  },
  {
    id: 'intro_integration',
    text: '**You\'re not filling out a form.** You\'re joining the crew. Choose your nation, your approach, your role. The threshold is near.',
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
