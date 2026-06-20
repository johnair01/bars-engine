/**
 * Playtest campaigns — test LENSES, not specializations.
 * Spec: .specify/specs/superpower-deck-quality/spec.md § Campaign harness
 *
 * IMPORTANT: cards/moves are campaign-agnostic. A campaign is only a lens for
 * checking applicability — `assessQuality` and the harness score a card's
 * intrinsic quality, independent of which campaign is in view. These three
 * deliberately differ in shape (money vs. organizing vs. individual advocacy)
 * to confirm the same cards stay useful across very different campaigns.
 */

import type { AllyshipDomain } from './vocabulary'

export interface Campaign {
  id: string
  goal: string
  /** How each domain shows up in this campaign — context for judging applicability. */
  domainFraming: Record<AllyshipDomain, string>
}

/** A personal fundraising goal (resource-heavy). */
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

/** A collective, non-money organizing effort. */
export const MUTUAL_AID_CAMPAIGN: Campaign = {
  id: 'stand-up-mutual-aid',
  goal: 'Stand up a neighborhood mutual-aid network',
  domainFraming: {
    GATHERING_RESOURCES: 'Gather volunteers, supplies, and space — recruit without burning people out.',
    RAISE_AWARENESS: 'Let neighbors know it exists and that needing help is normal.',
    DIRECT_ACTION: 'Actually deliver — match a need to a helper this week.',
    SKILLFUL_ORGANIZING: 'Build the roster, the intake, and the rotation so it survives you.',
  },
}

/** An individual-target advocacy effort (no money). */
export const COWORKER_ADVOCACY_CAMPAIGN: Campaign = {
  id: 'coworker-accommodation',
  goal: 'Help a coworker get the accommodation they need',
  domainFraming: {
    GATHERING_RESOURCES: 'Gather documentation, allies, and precedent that strengthen the case.',
    RAISE_AWARENESS: 'Make the need legible to the people who can actually decide.',
    DIRECT_ACTION: 'Make the request — and escalate cleanly if it stalls.',
    SKILLFUL_ORGANIZING: 'Line up the process, the timeline, and who does what.',
  },
}

export const CAMPAIGNS: Campaign[] = [CAR_CAMPAIGN, MUTUAL_AID_CAMPAIGN, COWORKER_ADVOCACY_CAMPAIGN]
