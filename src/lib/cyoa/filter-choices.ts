import { SIGNUP_CHOICE_TARGET_IDS } from '@/lib/cyoa/types'

export type MinimalChoice = { text: string; targetId: string; moveType?: string }

/**
 * CHS checkpoint + revalidate (B): campaign portal `Room_*` and `Portal_*` choices depend on instance context.
 * Hide Grow Up → schools when no schools adventure is linked (matches AdventurePlayer routing).
 */
export function revalidateCampaignPortalRoomChoices(
  nodeId: string,
  choices: MinimalChoice[],
  opts: { adventureSlug: string; schoolsAdventureId: string | null },
): MinimalChoice[] {
  const isCampaignPortal = opts.adventureSlug.startsWith('campaign-portal-')
  const isPortalOrRoom = /^Room_\d+$/.test(nodeId) || /^Portal_[1-8]$/.test(nodeId)
  if (!isCampaignPortal || !isPortalOrRoom) return choices
  if (opts.schoolsAdventureId) return choices
  return choices.filter((c) => c.targetId !== 'schools')
}

/**
 * Remove cold-signup / login-only choices when the player already has a session.
 * If that would leave no choices, provide a safe "Continue" to the Vault (dashboard path).
 */
export function applyAuthenticatedChoicePolicy(
  choices: MinimalChoice[],
  isAuthenticated: boolean
): MinimalChoice[] {
  if (!isAuthenticated) return choices

  const filtered = choices.filter((c) => !SIGNUP_CHOICE_TARGET_IDS.has(c.targetId))
  if (filtered.length > 0) return filtered

  // Only signup/login was offered — logged-in players skip account creation
  if (choices.some((c) => SIGNUP_CHOICE_TARGET_IDS.has(c.targetId))) {
    return [{ text: 'Continue to your Vault', targetId: 'redirect:/hand' }]
  }

  return choices
}

/** Apply auth policy to any adventure node payload before JSON response. */
export function finalizeAdventureNodePayload<T extends { choices: MinimalChoice[] }>(
  node: T,
  isAuthenticated: boolean
): T {
  return { ...node, choices: applyAuthenticatedChoicePolicy(node.choices, isAuthenticated) }
}
