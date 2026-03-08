/**
 * The 8 Kotter Stages mapped to archetype moves.
 * When a player with the matching playbook makes a move,
 * they can advance the quest to the next stage.
 */
export const KOTTER_STAGES = {
    1: { name: 'Urgency', move: 'THUNDERCLAP', trigram: 'Thunder', emoji: '⚡' },
    2: { name: 'Coalition', move: 'NURTURE', trigram: 'Earth', emoji: '🤝' },
    3: { name: 'Vision', move: 'COMMAND', trigram: 'Heaven', emoji: '👁' },
    4: { name: 'Communicate', move: 'EXPRESS', trigram: 'Lake', emoji: '🎭' },
    5: { name: 'Obstacles', move: 'INFILTRATE', trigram: 'Water', emoji: '💧' },
    6: { name: 'Wins', move: 'IGNITE', trigram: 'Fire', emoji: '🔥' },
    7: { name: 'Build On', move: 'PERMEATE', trigram: 'Wind', emoji: '🌬' },
    8: { name: 'Anchor', move: 'IMMOVABLE', trigram: 'Mountain', emoji: '⛰' },
} as const

export type KotterStage = keyof typeof KOTTER_STAGES

export type ArchetypeMove = typeof KOTTER_STAGES[KotterStage]['move']

/** Allyship domain for campaign context */
export type AllyshipDomain =
  | 'GATHERING_RESOURCES'
  | 'SKILLFUL_ORGANIZING'
  | 'RAISE_AWARENESS'
  | 'DIRECT_ACTION'

/**
 * Domain × Kotter stage actions (from kotter-by-domain.md).
 * Use stage action (e.g. "We need resources") not stage name (e.g. "Rally the Urgency") in generated quest titles.
 */
const STAGE_ACTIONS_BY_DOMAIN: Record<AllyshipDomain, Record<number, string>> = {
  GATHERING_RESOURCES: {
    1: 'We need resources',
    2: 'Who will contribute?',
    3: 'Fully resourced looks like…',
    4: 'Share the need',
    5: 'What blocks donations?',
    6: 'First milestone reached',
    7: 'Scale giving',
    8: 'Sustainable funding',
  },
  SKILLFUL_ORGANIZING: {
    1: 'We need capacity',
    2: 'Who are the builders?',
    3: 'System complete looks like…',
    4: 'Share the roadmap',
    5: 'What blocks implementation?',
    6: 'First feature shipped',
    7: 'Iterate and scale',
    8: 'Sustainable practices',
  },
  RAISE_AWARENESS: {
    1: 'People need to know',
    2: 'Who will spread the message?',
    3: 'Awareness looks like…',
    4: 'Tell the story',
    5: 'What blocks the message?',
    6: 'First cohort reached',
    7: 'Amplify',
    8: 'Embedded in culture',
  },
  DIRECT_ACTION: {
    1: 'What needs doing now?',
    2: 'Who is with you?',
    3: 'Completion looks like…',
    4: 'Coordinate action',
    5: 'What blocks you?',
    6: 'Quest completed',
    7: 'Take on more',
    8: "You're a player",
  },
}

/**
 * Get stage action (verb phrase) for a period and domain.
 * Use this for campaign-throughput quest generation — not Kotter stage names.
 */
export function getStageAction(
  period: number,
  domain: AllyshipDomain = 'GATHERING_RESOURCES'
): string {
  const stage = Math.max(1, Math.min(8, Math.round(period)))
  return STAGE_ACTIONS_BY_DOMAIN[domain][stage] ?? STAGE_ACTIONS_BY_DOMAIN.GATHERING_RESOURCES[stage]
}
