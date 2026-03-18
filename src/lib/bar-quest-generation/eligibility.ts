/**
 * BAR eligibility checker for quest generation
 * @see .specify/specs/bar-quest-generation-engine/spec.md Part 1
 */

import { db } from '@/lib/db'
import type { BarEligibilityInput, EligibilityResult } from './types'

const MIN_TITLE_LENGTH = 3
const MIN_DESCRIPTION_LENGTH = 10

/**
 * Check whether a BAR is eligible for quest generation.
 * Requirements:
 * - status = active
 * - title and description present (min length)
 * - allyshipDomain present
 * - BAR has not already been converted to a quest (no published quest from this BAR)
 */
export async function checkBarEligibilityForQuestGeneration(
  barId: string,
  options?: { allowRepeat?: boolean }
): Promise<EligibilityResult> {
  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      allyshipDomain: true,
      campaignRef: true,
      creatorId: true,
    },
  })

  if (!bar) {
    return { eligible: false, reason: 'BAR not found' }
  }

  return checkBarEligibility(bar as BarEligibilityInput, options)
}

/**
 * Check eligibility from an in-memory BAR (e.g. after fetch).
 * Use when you already have the BAR and want to avoid a second query.
 *
 * Allyship domain: required only for campaign quests (BAR has campaignRef).
 * Personal quests (no campaignRef) do not need allyship domain.
 */
export async function checkBarEligibility(
  bar: BarEligibilityInput,
  options?: { allowRepeat?: boolean }
): Promise<EligibilityResult> {
  if (bar.status !== 'active') {
    return { eligible: false, reason: 'BAR status must be active' }
  }

  const title = (bar.title || '').trim()
  if (title.length < MIN_TITLE_LENGTH) {
    return { eligible: false, reason: 'Title is required and must be at least 3 characters' }
  }

  const description = (bar.description || '').trim()
  if (description.length < MIN_DESCRIPTION_LENGTH) {
    return { eligible: false, reason: 'Description is required and must be at least 10 characters' }
  }

  const hasCampaignRef = !!(bar.campaignRef && bar.campaignRef.trim())
  if (hasCampaignRef && (!bar.allyshipDomain || !bar.allyshipDomain.trim())) {
    return {
      eligible: false,
      reason: 'Allyship domain is required for campaign quests; inherit from campaign context when emitting BAR',
    }
  }

  if (!options?.allowRepeat) {
    const alreadyConverted = await db.customBar.findFirst({
      where: { sourceBarId: bar.id },
      select: { id: true },
    })
    if (alreadyConverted) {
      return { eligible: false, reason: 'BAR has already been converted to a quest' }
    }
  }

  return { eligible: true }
}
