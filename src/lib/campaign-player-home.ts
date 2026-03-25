/**
 * Canonical links for “campaign home” vs onboarding funnel (`/campaign` may redirect BB to initiation).
 */

export function resolveDefaultCampaignRef(
  activeInstanceCampaignRef: string | null | undefined,
  fallback = 'bruised-banana',
): string {
  const r = activeInstanceCampaignRef?.trim()
  return r && r.length > 0 ? r : fallback
}

export function campaignHomePath(opts: {
  campaignRef: string
  /** When true, `/campaign?ref=` preserves BB initiation / twine routing for players still in orientation. */
  useOnboardingCampaignRoute: boolean
}): string {
  const q = encodeURIComponent(opts.campaignRef)
  if (opts.useOnboardingCampaignRoute) {
    return `/campaign?ref=${q}`
  }
  return `/campaign/hub?ref=${q}`
}

/**
 * Use onboarding funnel when global onboarding flag is false **or** an orientation thread is still active.
 * (Active orientation threads are loaded with `completedAt: null`.)
 */
export function needsCampaignOnboardingRoute(
  player: { onboardingComplete: boolean },
  hasActiveOrientationThread: unknown | null,
): boolean {
  if (!player.onboardingComplete) return true
  return hasActiveOrientationThread != null
}
