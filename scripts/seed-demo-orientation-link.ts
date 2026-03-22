/**
 * Create a DemoOrientationLink for local/staging smoke tests.
 * Usage: npx tsx scripts/seed-demo-orientation-link.ts
 *
 * Prints /demo/orientation?t=<token> when successful.
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { randomBytes } from 'crypto'

async function main() {
  // Must use the adventure whose slug is `bruised-banana` — the node API only
  // serves BB_Intro / passages / dynamic nodes on that path (see adventures route).
  let adventure = await db.adventure.findFirst({
    where: {
      status: 'ACTIVE',
      slug: 'bruised-banana',
    },
    select: { id: true, slug: true, startNodeId: true },
  })

  if (!adventure) {
    adventure = await db.adventure.findFirst({
      where: {
        status: 'ACTIVE',
        campaignRef: 'bruised-banana',
        subcampaignDomain: null,
      },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, slug: true, startNodeId: true },
    })
    if (adventure) {
      console.warn(
        'Warning: No ACTIVE adventure with slug "bruised-banana"; using campaignRef match. ' +
          'Preview API may 404 unless slug is normalized (resolve uses campaignRef). Re-seed after creating bruised-banana adventure.'
      )
    }
  }

  if (!adventure) {
    console.error('No ACTIVE bruised-banana adventure found. Seed campaigns first.')
    process.exit(1)
  }

  const startNodeId = adventure.startNodeId || 'BB_Intro'
  const token = randomBytes(16).toString('hex')

  const link = await db.demoOrientationLink.upsert({
    where: { publicSlug: 'bruised-banana-preview' },
    create: {
      token,
      publicSlug: 'bruised-banana-preview',
      adventureId: adventure.id,
      startNodeId,
      campaignRef: 'bruised-banana',
      maxSteps: 12,
      label: 'Bruised Banana — orientation preview',
    },
    update: {
      token,
      adventureId: adventure.id,
      startNodeId,
      campaignRef: 'bruised-banana',
      maxSteps: 12,
      label: 'Bruised Banana — orientation preview',
      revokedAt: null,
    },
  })

  console.log('Created DemoOrientationLink:', link.id)
  console.log('')
  console.log('  Token URL:   /demo/orientation?t=' + token)
  console.log('  Slug URL:    /demo/orientation?s=bruised-banana-preview')
  console.log('')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
