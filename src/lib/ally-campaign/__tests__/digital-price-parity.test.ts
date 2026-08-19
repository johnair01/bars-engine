import { describe, expect, it } from 'vitest'

import { offerByKey } from '@/lib/launch/offers'
import { LAUNCH_DEFAULT_CONTENT } from '@/lib/launch/page-content'
import { INPUTS, digitalEconomics } from '../economics'
import { WARM_EDITION } from '../warm-selling'

/**
 * The storefront and the campaign's arithmetic must agree about the price of the
 * thing allies are sent out to sell.
 *
 * This drifted once already: the plan was costed at $30 while the live offer was
 * pay-what-you-want at $15, which would have had allies asking five people each
 * to buy a $30 book on a page inviting $15 — and every copy target in the
 * campaign silently overstated by roughly half. These tests exist so that
 * particular failure can only happen once.
 */
describe('digital price parity — storefront vs campaign economics', () => {
  const offer = offerByKey(WARM_EDITION)

  it('the edition allies sell exists in the storefront catalogue', () => {
    expect(offer).toBeDefined()
  })

  it('the offer price equals the price every copy target is computed from', () => {
    expect(offer!.priceCents).toBe(INPUTS.digitalPriceCents)
  })

  it('is a fixed price, not pay-what-you-want', () => {
    // A PWYW page cannot support a specific ask. If this ever becomes desirable
    // again, the campaign has to be recosted on the realistic AVERAGE paid — the
    // anchor is not what people pay.
    expect(offer!.pwyw ?? false).toBe(false)
  })

  it('its blurb no longer invites a different number', () => {
    expect(offer!.blurb).not.toMatch(/pay what|suggested|name your price/i)
    expect(offer!.cta).not.toMatch(/name your price/i)
  })

  it('the launch page default copy agrees — the offer is described in two files', () => {
    // The pay-what-you-want language survived the first fix because a second
    // copy lives in `launch/page-content`. Both are asserted so a price change
    // cannot be half-applied.
    //
    // ⚠️ LIMIT OF THIS TEST: the launch page renders DB-stored content
    // (`appConfig`, editable in-app by an admin) layered OVER these defaults.
    // Code cannot assert what is in that row, so a green suite here does NOT
    // prove the live page is right — it proves a fresh environment would be.
    // The stored copy has to be changed through the launch page editor.
    const page = LAUNCH_DEFAULT_CONTENT.offers[WARM_EDITION]
    expect(page).toBeDefined()
    expect(page.blurb).not.toMatch(/pay what|suggested seed|\$15/i)
    expect(page.kicker ?? '').not.toMatch(/name your price/i)
  })

  it('the margin the whole plan runs on derives from that same price', () => {
    expect(digitalEconomics().marginCents).toBe(
      offer!.priceCents - INPUTS.digitalUnitCostCents,
    )
  })

  it('digital stays below the physical edition, so the tiers make sense', () => {
    expect(INPUTS.digitalPriceCents).toBeLessThan(INPUTS.bookRetailPriceCents)
  })
})
