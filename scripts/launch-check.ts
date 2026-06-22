#!/usr/bin/env npx tsx
/**
 * Launch storefront readiness check — is the store actually sellable?
 *
 * Every offer on /launch links out to Gumroad via a NEXT_PUBLIC_GUMROAD_*_URL.
 * When that's unset the offer renders "Setup pending" (isOfferLive) and CANNOT
 * be bought. This script reports, per SKU, whether the buy link and the
 * license-verify product id are wired, plus the global webhook config — so you
 * get instant feedback while setting up Gumroad instead of discovering a dead
 * storefront in production.
 *
 * Usage:
 *   npm run launch:check            # report; exits 1 if NOTHING is sellable
 *   npm run launch:check -- --strict  # exits 1 if ANY offer is not fully wired
 *
 * Run after `npm run env:pull:production` (or against your local .env.local) to
 * check what Production will actually serve.
 */
import { config } from 'dotenv'

config({ path: '.env' })
config({ path: '.env.local', override: true })

// Buy-link env var per SKU — mirrors the GUMROAD map in
// src/lib/launch/offers.ts (Next inlines those NEXT_PUBLIC_* reads statically,
// so they can't be derived dynamically there). KEEP IN SYNC with offers.ts.
const BUY_URL_ENV: Record<string, string> = {
  'founding-ally': 'NEXT_PUBLIC_GUMROAD_FOUNDING_ALLY_URL',
  'book-digital': 'NEXT_PUBLIC_GUMROAD_BOOK_DIGITAL_URL',
  'rpg-handbook-digital': 'NEXT_PUBLIC_GUMROAD_RPG_DIGITAL_URL',
  'deck-digital': 'NEXT_PUBLIC_GUMROAD_DECK_DIGITAL_URL',
  'game-subscription': 'NEXT_PUBLIC_GUMROAD_GAME_SUB_URL',
  'book-physical': 'NEXT_PUBLIC_GUMROAD_BOOK_PHYSICAL_URL',
  'rpg-handbook-physical': 'NEXT_PUBLIC_GUMROAD_RPG_PHYSICAL_URL',
}

/** Product-id env candidates per SKU (mirrors gumroad.ts productIdForSku). */
function productIdEnvs(sku: string): string[] {
  const specific = `GUMROAD_PRODUCT_ID_${sku.toUpperCase().replace(/-/g, '_')}`
  return sku === 'book-digital' ? [specific, 'GUMROAD_PRODUCT_ID'] : [specific]
}

const has = (name: string): boolean => !!process.env[name]?.trim()
const firstSet = (names: string[]): string | undefined => names.find(has)
const yes = '✓'
const no = '✗'

async function main() {
  const { LAUNCH_OFFERS } = await import('../src/lib/launch/offers')
  const strict = process.argv.includes('--strict')

  console.log('\nLaunch storefront readiness — env: .env + .env.local\n')
  console.log('  ' + 'OFFER'.padEnd(26) + 'BUY LINK'.padEnd(12) + 'LICENSE VERIFY')

  let sellable = 0
  let fullyWired = 0
  for (const offer of LAUNCH_OFFERS) {
    const buyEnv = BUY_URL_ENV[offer.key]
    const buyOk = !!buyEnv && has(buyEnv)
    const idEnv = firstSet(productIdEnvs(offer.key))
    if (buyOk) sellable++
    if (buyOk && idEnv) fullyWired++
    const buyCell = buyOk ? `${yes} live` : `${no} pending`
    const idCell = idEnv ? `${yes} ${idEnv}` : `${no} (no ${productIdEnvs(offer.key)[0]})`
    console.log('  ' + offer.key.padEnd(26) + buyCell.padEnd(12) + idCell)
  }

  console.log('')
  // Global commerce config.
  const webhook = has('GUMROAD_WEBHOOK_SECRET')
  const verifyMode = process.env.GUMROAD_VERIFY_MODE?.trim() || 'live'
  console.log(`  GUMROAD_WEBHOOK_SECRET   ${webhook ? yes + ' set' : no + ' MISSING — webhook rejects all sales (buyers must use the /redeem license fallback)'}`)
  console.log(`  GUMROAD_SELLER_ID        ${has('GUMROAD_SELLER_ID') ? yes + ' set' : '· optional'}`)
  console.log(`  GUMROAD_PRODUCT_MAP      ${has('GUMROAD_PRODUCT_MAP') ? yes + ' set' : '· optional (permalink→SKU override)'}`)
  console.log(`  GUMROAD_VERIFY_MODE      ${verifyMode === 'mock' ? no + ' mock — NOT verifying real licenses!' : yes + ' live'}`)

  const total = LAUNCH_OFFERS.length
  console.log(`\n  ${sellable}/${total} offers sellable (buy link wired) · ${fullyWired}/${total} also license-verifiable\n`)

  if (sellable === 0) {
    console.log(`${no} Store is NOT sellable — no offer has a buy link. Set the NEXT_PUBLIC_GUMROAD_*_URL vars in Vercel (+ .env.local), then re-run.\n`)
    process.exit(1)
  }
  if (strict && (fullyWired < total || !webhook || verifyMode === 'mock')) {
    console.log(`${no} --strict: not every offer is fully wired (buy link + product id + webhook + live verify).\n`)
    process.exit(1)
  }
  console.log(`${yes} ${sellable} offer(s) can be purchased on /launch.\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
