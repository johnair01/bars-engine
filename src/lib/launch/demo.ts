/**
 * Launch demo mode — the "walk the funnel without paying" switch.
 *
 * When `NEXT_PUBLIC_LAUNCH_DEMO_MODE=1`, the /launch offer grid routes its CTAs
 * to an internal demo checkout instead of Gumroad. The demo checkout mints a
 * real RedemptionCode (source: 'demo') and hands off to the existing
 * /success → /redeem → entitlement flow, so a reviewer clicks through the
 * genuine redemption pipeline end-to-end — only the payment screen is replaced.
 *
 * Single env flag, read server-side and passed to client components as a prop
 * (never read in the client island directly). Off by default; explicit opt-in
 * for staging / inner-council walkthroughs, never the production buy path.
 */

import { LAUNCH_OFFERS, type LaunchOffer, type OfferKey } from '@/lib/launch/offers'

/** The reviewer-facing demo flag. Honest default: off. */
export function isLaunchDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_LAUNCH_DEMO_MODE === '1'
}

/** Resolve a raw query value to a known launch offer, or undefined. */
export function offerForKey(key: string | undefined): LaunchOffer | undefined {
  if (!key) return undefined
  return LAUNCH_OFFERS.find((o) => o.key === (key as OfferKey))
}

/** The internal demo-checkout href for an offer (used in place of its Gumroad URL). */
export function demoCheckoutHref(key: OfferKey): string {
  return `/launch/demo-checkout?sku=${encodeURIComponent(key)}`
}
