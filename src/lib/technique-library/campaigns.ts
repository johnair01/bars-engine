/**
 * Playtest campaigns for quality assessment.
 * Spec: .specify/specs/superpower-deck-quality/spec.md § Campaign harness
 */

import type { AllyshipDomain } from './vocabulary'

export interface Campaign {
  id: string
  goal: string
  /** How each domain shows up in this campaign — context for judging applicability. */
  domainFraming: Record<AllyshipDomain, string>
}

/** The live campaign: raise $8,500 for a new car. */
export const CAR_CAMPAIGN: Campaign = {
  id: 'raise-8500-for-a-car',
  goal: 'Raise $8,500 to get a new car',
  domainFraming: {
    GATHERING_RESOURCES: 'Make the asks — who gives, how much, and how to invite without pressure.',
    RAISE_AWARENESS: 'Tell why the car matters — the story that makes people want to help.',
    DIRECT_ACTION: 'The concrete ask itself — post the page, send the message, name the number.',
    SKILLFUL_ORGANIZING: 'Coordinate the push — matches, milestones, a small crew, follow-up.',
  },
}
