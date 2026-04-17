/**
 * Headless OBT Test: Offer Bar / Time-Space Flow (DB layer)
 *
 * Mirrors src/actions/offer-bar-from-dsw.ts
 * Run with: bun run scripts/test-OBT-offer-bar.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const PLAYER_ID = 'cmo1ynazb000284mvisdfyfoy'

async function main() {
  console.log('🧪 OBT: Offer Bar / Time-Space Flow (DB Layer)\n')

  // Player
  const player = await db.player.findUnique({ where: { id: PLAYER_ID } })
  if (!player) {
    console.error('❌ Player not found:', PLAYER_ID)
    process.exit(1)
  }
  console.log('Player:', player.name, '(', player.id, ')')

  // Vault cap check (skip if at capacity)
  const cap = await db.customBar.count({
    where: { creatorId: player.id, visibility: 'private' },
  })
  console.log('Current private drafts:', cap)

  // OBT Step 1: Create offer bar via DSW path
  const title = 'OBT test: offer bar time-space'
  const description = 'Testing the offer-bar creation flow headlessly. Venue: test session.'
  const offerInput = {
    title,
    description,
    venue: 'headless-test-session',
  }

  // Mirror the DSW validation
  const OFFER_BAR_TITLE_MAX = 200
  const OFFER_BAR_DESCRIPTION_MAX = 2000
  if (!offerInput.title.trim()) {
    console.error('❌ Title is required')
    process.exit(1)
  }
  if (offerInput.title.trim().length > OFFER_BAR_TITLE_MAX) {
    console.error('❌ Title too long (max', OFFER_BAR_TITLE_MAX, ')')
    process.exit(1)
  }
  if (!offerInput.description.trim()) {
    console.error('❌ Description is required')
    process.exit(1)
  }

  // Find instance for allyshipDomain
  const instance = await db.instance.findFirst({
    where: { OR: [{ slug: 'mastering-allyship' }, { campaignRef: 'mastering-allyship' }] },
    select: { allyshipDomain: true, primaryCampaignDomain: true },
  })
  console.log('Instance:', instance?.slug ?? 'none')

  // Create the offer bar (mirror of offer-bar-from-dsw.ts)
  const bar = await db.customBar.create({
    data: {
      creatorId: player.id,
      title: offerInput.title.trim().slice(0, OFFER_BAR_TITLE_MAX),
      description: offerInput.description.trim(),
      type: 'vibe',
      reward: 1,
      visibility: 'private',
      status: 'active',
      claimedById: player.id,
      inputs: JSON.stringify([]),
      rootId: 'temp',
      campaignRef: null,
      allyshipDomain: instance?.allyshipDomain ?? instance?.primaryCampaignDomain ?? null,
      docQuestMetadata: JSON.stringify({
        offerKind: 'creative',
        skillBand: 'exploration',
        protocolVersion: '1.0',
        venue: offerInput.venue,
      }),
    },
  })

  // Fix rootId
  await db.customBar.update({ where: { id: bar.id }, data: { rootId: bar.id } })

  console.log('\n✅ Created offer bar:', bar.id)
  console.log('   Type:', bar.type, '| Reward:', bar.reward, '| Visibility:', bar.visibility)

  // OBT Step 2: Verify bar exists and is claimable
  const fetched = await db.customBar.findUnique({ where: { id: bar.id } })
  if (!fetched) {
    console.error('❌ Bar not found after create')
    process.exit(1)
  }
  console.log('\n✅ Bar verified in DB')
  console.log('   claimedById:', fetched.claimedById, '| rootId:', fetched.rootId)

  // OBT Step 3: Verify offer bar counts toward vault cap
  const newCap = await db.customBar.count({
    where: { creatorId: player.id, visibility: 'private' },
  })
  console.log('\n✅ Vault draft count after creation:', newCap)
  if (newCap !== cap + 1) {
    console.error('❌ Vault count mismatch, expected', cap + 1, 'got', newCap)
    process.exit(1)
  }

  // Cleanup
  await db.customBar.delete({ where: { id: bar.id } })
  console.log('\n🧹 Cleaned up test bar')

  console.log('\n✅ OBT PASSED: offer bar / time-space flow works headlessly')
  console.log('   Next: verify offer-bar appears in /hand, verify UI at /hand')
}

main()
  .catch(err => {
    console.error('❌ Error:', err.message)
    process.exit(1)
  })
  .finally(() => db.$disconnect())