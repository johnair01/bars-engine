/**
 * @route GET /api/onboarding/donation-url
 * @entity CAMPAIGN
 * @description Retrieve campaign donation URL for active instance (Stripe, Venmo, CashApp, or PayPal)
 * @permissions public
 * @relationships CAMPAIGN (Instance payment URLs)
 * @dimensions WHO:donor, WHAT:payment URL, WHERE:campaign context, ENERGY:contribution flow
 * @example /api/onboarding/donation-url
 * @agentDiscoverable true
 */
import { NextResponse, type NextRequest } from 'next/server'
import { getInstanceForDonation } from '@/lib/donation-instance'

/**
 * Return the campaign's donation URL for external donate link.
 * Uses Instance.stripeOneTimeUrl or first available payment URL.
 * Optional `?ref=` scopes to the Instance with that `campaignRef` (e.g. bruised-banana).
 */
export async function GET(request: NextRequest) {
  try {
    const ref = request.nextUrl.searchParams.get('ref')?.trim() || null
    const instance = await getInstanceForDonation(ref)
    const url =
      instance?.stripeOneTimeUrl ||
      instance?.venmoUrl ||
      instance?.cashappUrl ||
      instance?.paypalUrl ||
      null
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ url: null })
  }
}
