/**
 * Same-origin path only; blocks protocol-relative `//…` open redirects.
 */
export function isSafeAppPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//')
}

/**
 * Build onboarding URL (Deprecated: now points to Dashboard-first flow).
 */
export function buildOnboardingUrl(_params?: {
  returnTo?: string
  ritual?: boolean
  reset?: boolean
}) {
  return '/'
}

export function resolvePostOnboardingRedirect(returnTo: string | undefined, fallback: string): string {
  if (returnTo && isSafeAppPath(returnTo)) return returnTo
  return fallback
}
