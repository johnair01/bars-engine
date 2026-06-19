#!/usr/bin/env npx tsx
/**
 * Clean up demo-mode purchases.
 *
 * The /launch demo path (NEXT_PUBLIC_LAUNCH_DEMO_MODE=1) mints real
 * RedemptionCodes and grants real Entitlements, both tagged `source: 'demo'`,
 * so a funnel walkthrough leaves real rows behind. This removes them.
 *
 * Dry-run by default — it only reports. Pass --apply to actually delete.
 * Codes are deleted before entitlements (the code FK-references the entitlement).
 *
 * Usage:
 *   npm run launch:demo:clean           # report what would be removed
 *   npm run launch:demo:clean -- --apply  # delete demo codes + entitlements
 */
import './require-db-env'
import { db } from '../src/lib/db'

const apply = process.argv.includes('--apply')

async function main() {
  const [codes, entitlements] = await Promise.all([
    db.redemptionCode.findMany({ where: { source: 'demo' }, select: { code: true, sku: true } }),
    db.entitlement.findMany({ where: { source: 'demo' }, select: { sku: true, playerId: true } }),
  ])

  console.log(`Demo redemption codes:  ${codes.length}`)
  console.log(`Demo entitlements:      ${entitlements.length}`)

  if (codes.length === 0 && entitlements.length === 0) {
    console.log('\nNothing to clean. ✓')
    return
  }

  if (!apply) {
    console.log('\nDry run — re-run with `-- --apply` to delete the rows above.')
    return
  }

  // Codes first: RedemptionCode.entitlementId references Entitlement.
  const delCodes = await db.redemptionCode.deleteMany({ where: { source: 'demo' } })
  const delEnts = await db.entitlement.deleteMany({ where: { source: 'demo' } })
  console.log(`\nDeleted ${delCodes.count} demo codes and ${delEnts.count} demo entitlements. ✓`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
