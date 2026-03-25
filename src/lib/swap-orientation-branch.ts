import { isGameAccountReady } from '@/lib/auth'
import { SWAP_ORIENT_PASSAGES } from '@/lib/clothing-swap-event-invite-story'

/**
 * CSHE Phase B — server-evaluated branch for orientation CYOA.
 *
 * **Returning (short path):** `isGameAccountReady(player)` — same signal as golden-path /
 * forge flows: `inviteId` present and `onboardingComplete === true`.
 *
 * **New / anonymous / incomplete onboarding:** start at story `intro` (self-serve branch
 * or long path). Aligns with golden-path-onboarding-action-loop “game-ready” gate.
 */
export function swapOrientationInitialPassageId(
  player: { inviteId: string; onboardingComplete: boolean } | null
): string {
  if (player && isGameAccountReady(player)) {
    return SWAP_ORIENT_PASSAGES.returningEnd
  }
  return SWAP_ORIENT_PASSAGES.intro
}
