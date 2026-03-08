/**
 * Onboarding CYOA Generator — Main API
 *
 * Wraps compileQuest with Epiphany Bridge (6 beats) and onboarding-specific config.
 * Action node: Donate (Show Up) or Sign Up (Wake Up) based on campaignRef.
 * See .specify/specs/onboarding-cyoa-generator/spec.md
 */

import { compileQuest } from '@/lib/quest-grammar'
import type { QuestPacket } from '@/lib/quest-grammar'
import type { OnboardingCYOAInput } from './types'

/**
 * Generate onboarding CYOA from Campaign Owner unpacking.
 * Uses Epiphany Bridge (6 beats); action node type derived from campaignRef.
 */
export function generateOnboardingCYOA(input: OnboardingCYOAInput): QuestPacket {
  const { unpackingAnswers, alignedAction, segment, campaignRef } = input

  return compileQuest({
    unpackingAnswers,
    alignedAction,
    segment,
    campaignId: campaignRef,
    questModel: 'personal',
  })
}
