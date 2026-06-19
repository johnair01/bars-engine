'use server'

/**
 * Demo checkout action — the payment-free hand-off for funnel walkthroughs.
 *
 * Stands in for Gumroad's hosted checkout when NEXT_PUBLIC_LAUNCH_DEMO_MODE=1.
 * It mints a real RedemptionCode (source: 'demo') for the chosen SKU and routes
 * the reviewer to /success?code=… — from there the genuine redemption pipeline
 * runs unchanged (success → sign in → redeem → entitlement → unlock). No Gumroad
 * product, webhook, or payment is involved; only the checkout screen is faked.
 */

import { redirect } from 'next/navigation'
import { mintRedemptionCode } from '@/lib/entitlements/service'
import { isLaunchDemoMode, offerForKey } from '@/lib/launch/demo'

/**
 * Complete a demo "purchase": mint a code for the form's `sku` and redirect to
 * the success page carrying it. Guarded — a no-op redirect to /launch when demo
 * mode is off or the SKU is unknown, so it can never mint outside a demo deploy.
 */
export async function completeDemoCheckout(formData: FormData): Promise<void> {
  if (!isLaunchDemoMode()) redirect('/launch')

  const offer = offerForKey(String(formData.get('sku') ?? '').trim())
  if (!offer) redirect('/launch')

  const rc = await mintRedemptionCode({ sku: offer.key, source: 'demo' })

  redirect(
    `/success?${new URLSearchParams({ sku: offer.key, code: rc.code, demo: '1' }).toString()}`,
  )
}
