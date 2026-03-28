/**
 * Same-origin path only; blocks protocol-relative `//…` open redirects.
 */
export function isSafeAppPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//')
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
