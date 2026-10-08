/**
 * Same-origin path only; blocks protocol-relative `//…` open redirects.
 */
export function isSafeAppPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//')
}

/**
 * Post-login destinations that should skip the Conclave onboarding trap when the profile
 * is incomplete (same idea as donate flows — see `/login`).
 */
export function isPublicCampaignEntryReturnTo(returnTo: string | undefined): boolean {
  if (!returnTo || !isSafeAppPath(returnTo)) return false
  if (returnTo === '/event/donate' || returnTo.startsWith('/event/donate?') || returnTo.startsWith('/event/donate/')) {
    return true
  }
  if (returnTo === '/demo/bruised-banana/donate' || returnTo.startsWith('/demo/bruised-banana/donate?')) {
    return true
  }
  if (returnTo === '/campaign/initiation' || returnTo.startsWith('/campaign/initiation?')) {
    return true
  }
  // Campaign join pages — allow redirect back after login to complete membership
  if (/^\/campaign\/[^/]+\/join(\?.*)?$/.test(returnTo)) {
    return true
  }
  return false
}

/**
 * Where to send a player once an adventure/ritual finishes.
 *
 * `/conclave/onboarding` was retired and this was stubbed to always return `/` —
 * but it kept taking a `returnTo` its callers still pass, and silently threw it
 * away. Every completion therefore dumped the player on the dashboard:
 *   "upon completion it took be back to the beginning of the CYOA. It does give
 *    me an ability to go back to the hub, but it should take players right back
 *    to where the NPC they are talking to was… we need to make sure this loop
 *    closes" (site signal, 2026-04-08)
 *
 * `returnTo` now wins when it is a safe same-origin path; `/` remains the
 * fallback, so onboarding callers that pass nothing behave exactly as before.
 * `ritual` and `reset` are still accepted and unused — the retired route was
 * the only thing that consumed them.
 */
export function buildOnboardingUrl(params?: {
  returnTo?: string
  ritual?: boolean
  reset?: boolean
}) {
  return resolvePostOnboardingRedirect(params?.returnTo, '/')
}

export function resolvePostOnboardingRedirect(returnTo: string | undefined, fallback: string): string {
  if (returnTo && isSafeAppPath(returnTo)) return returnTo
  return fallback
}
