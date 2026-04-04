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
 * Build `/conclave/onboarding` URL with optional `returnTo` (post-orientation),
 * `ritual`, and `reset` query params.
 */
export function buildOnboardingUrl(opts: { returnTo?: string; ritual?: boolean; reset?: boolean }): string {
  const q = new URLSearchParams()
  if (opts.returnTo && isSafeAppPath(opts.returnTo)) {
    q.set('returnTo', opts.returnTo)
  }
  if (opts.ritual) q.set('ritual', 'true')
  if (opts.reset) q.set('reset', 'true')
  const s = q.toString()
  return s ? `/conclave/onboarding?${s}` : '/conclave/onboarding'
}

export function resolvePostOnboardingRedirect(returnTo: string | undefined, fallback: string): string {
  if (returnTo && isSafeAppPath(returnTo)) return returnTo
  return fallback
}
