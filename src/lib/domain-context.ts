/**
 * Allyship domain context — essence, phrasings, and style guides.
 * Affects portal hints, lobby copy, quest generation, and wiki.
 *
 * Domains = WHERE the work happens. More context = more paths to effective action.
 * @see .specify/specs/portal-path-hint-gm-interview/GATHERING_RESOURCES_HOLISTIC_EXPLORATION.md
 */

import type { AllyshipDomain } from '@/lib/kotter'

/** Domain essence: holistic definition for system prompts and wiki. */
export const DOMAIN_ESSENCE: Record<AllyshipDomain, string> = {
  GATHERING_RESOURCES:
    'Time, attention, skills, and presence—that which allows life to unfold. Gathering is relational: inviting participation, weaving community support, fostering belonging. Resources can be money, materials, time, attention, skills, presence.',
  SKILLFUL_ORGANIZING:
    'Building capacity for the whole. Creating systems, processes, and interfaces that solve what is emergent. The problem is lack of organization; the work is relational—inviting co-design, sharing ownership, making the invisible visible.',
  RAISE_AWARENESS:
    'Helping people see what is possible. Visibility, messaging, discovery. People are not yet aware of resources, organization, or actions available. The work is relational—making the invisible visible, inviting people to discover.',
  DIRECT_ACTION:
    'Doing—and enabling others to do. Removing obstacles, increasing capacity, taking the next step. The work is relational—acting together, aligning efforts, moving as one.',
}

/**
 * Warm phrasings per stage per domain.
 * Used for lobby, portal hints, and player-facing copy.
 * Avoids: vague "we", desperate "need", generic "resources".
 * Frames as invitation and opportunity.
 */
export const STAGE_PHRASINGS_WARM: Record<AllyshipDomain, Record<number, string>> = {
  GATHERING_RESOURCES: {
    1: 'gathering what allows life to unfold—time, attention, skills, presence',
    2: 'who wants to share their gifts? An invitation to contribute',
    3: 'imagining us at our best—what does fully resourced look like?',
    4: 'sharing the story, telling others what calls to you',
    5: "naming what's in the way—and moving through it",
    6: 'first milestone reached—a win worth celebrating',
    7: 'scaling what works, growing the giving',
    8: 'sustainable for the long haul—we are in this together',
  },
  SKILLFUL_ORGANIZING: {
    1: 'building capacity—systems, processes, interfaces for what emerges',
    2: 'who wants to co-create? An invitation to builders',
    3: 'imagining the system complete—what does that look like?',
    4: 'sharing the roadmap, making the plan visible',
    5: "naming what's blocking implementation—and moving through it",
    6: 'first milestone shipped—a win worth celebrating',
    7: 'iterating and scaling, growing what works',
    8: 'sustainable practices—we are in this together',
  },
  RAISE_AWARENESS: {
    1: 'spreading the word—helping people see what is possible',
    2: 'who wants to amplify? An invitation to messengers',
    3: 'imagining awareness reached—what does that look like?',
    4: 'telling the story, making it visible',
    5: "naming what's blocking the message—and moving through it",
    6: 'first cohort reached—a win worth celebrating',
    7: 'amplifying, growing the reach',
    8: 'embedded in culture—we are in this together',
  },
  DIRECT_ACTION: {
    1: 'what calls to action now? An invitation to do',
    2: 'who is with you? An invitation to align',
    3: 'imagining completion—what does that look like?',
    4: 'coordinating action, moving together',
    5: "naming what's blocking you—and moving through it",
    6: 'quest completed—a win worth celebrating',
    7: 'taking on more, growing the impact',
    8: "you're a player—we are in this together",
  },
}

/**
 * Get warm (invitation-style) phrasing for a stage and domain.
 * Use for lobby, portal hints, and player-facing copy.
 */
export function getStagePhraseWarm(
  stage: number,
  domain: AllyshipDomain
): string {
  const s = Math.max(1, Math.min(8, Math.round(stage))) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  return STAGE_PHRASINGS_WARM[domain]?.[s] ?? STAGE_PHRASINGS_WARM.GATHERING_RESOURCES[s]
}
