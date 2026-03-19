#!/usr/bin/env npx tsx
/**
 * Seed Mastering the Game of Allyship instances.
 *
 * Creates:
 * - allyship-nonprofit (parent, SKILLFUL_ORGANIZING)
 * - allyship-book (sub-campaign, DIRECT_ACTION)
 * - allyship-card-game (sub-campaign, DIRECT_ACTION)
 * - allyship-fundraising (sub-campaign, GATHERING_RESOURCES, linked to bruised-banana)
 *
 * Optionally adds owner memberships for Carolyn Manson.
 * Set ALLYSHIP_OWNER_EMAIL or ALLYSHIP_OWNER_NAME to add memberships.
 *
 * Run: npx tsx scripts/seed-allyship-instances.ts
 * Or:  npm run seed:allyship-instances
 *
 * @see .specify/specs/allyship-campaign-admin/spec.md
 */

import './require-db-env'
import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Seeding Allyship instances...\n')

  // 1. Find bruised-banana for source and link
  const bruisedBanana = await db.instance.findFirst({
    where: { OR: [{ slug: 'bruised-banana' }, { campaignRef: 'bruised-banana' }] },
  })
  if (!bruisedBanana) {
    console.warn('  ⚠ bruised-banana instance not found. Source/link will be null. Create it first if needed.')
  }

  const sourceId = bruisedBanana?.id ?? null
  const linkedId = bruisedBanana?.id ?? null

  // 2. Create parent: allyship-nonprofit
  const nonprofit = await db.instance.upsert({
    where: { slug: 'allyship-nonprofit' },
    update: {
      primaryCampaignDomain: 'SKILLFUL_ORGANIZING',
      allyshipDomain: 'SKILLFUL_ORGANIZING',
      parentInstanceId: null,
      linkedInstanceId: null,
      sourceInstanceId: sourceId,
      campaignRef: 'allyship-nonprofit',
      domainType: 'business',
    },
    create: {
      slug: 'allyship-nonprofit',
      name: 'Mastering the Game of Allyship Non-Profit',
      domainType: 'business',
      campaignRef: 'allyship-nonprofit',
      primaryCampaignDomain: 'SKILLFUL_ORGANIZING',
      allyshipDomain: 'SKILLFUL_ORGANIZING',
      parentInstanceId: null,
      linkedInstanceId: null,
      sourceInstanceId: sourceId,
      targetDescription: 'Start the Mastering the Game of Allyship Non-Profit. Skilled organizing for allyship work.',
    },
  })
  console.log(`  ✓ allyship-nonprofit (parent) — ${nonprofit.id}`)

  // 3. Create sub-campaigns
  const book = await db.instance.upsert({
    where: { slug: 'allyship-book' },
    update: {
      primaryCampaignDomain: 'DIRECT_ACTION',
      allyshipDomain: 'DIRECT_ACTION',
      parentInstanceId: nonprofit.id,
      linkedInstanceId: null,
      sourceInstanceId: sourceId,
    },
    create: {
      slug: 'allyship-book',
      name: 'Edit & Finish the Mastering the Game of Allyship Book',
      domainType: 'business',
      campaignRef: 'allyship-book',
      primaryCampaignDomain: 'DIRECT_ACTION',
      allyshipDomain: 'DIRECT_ACTION',
      parentInstanceId: nonprofit.id,
      linkedInstanceId: null,
      sourceInstanceId: sourceId,
      targetDescription: 'Edit and finish the Mastering the Game of Allyship book. Direct action creative project.',
    },
  })
  console.log(`  ✓ allyship-book (sub-campaign) — ${book.id}`)

  const cardGame = await db.instance.upsert({
    where: { slug: 'allyship-card-game' },
    update: {
      primaryCampaignDomain: 'DIRECT_ACTION',
      allyshipDomain: 'DIRECT_ACTION',
      parentInstanceId: nonprofit.id,
      linkedInstanceId: null,
      sourceInstanceId: sourceId,
    },
    create: {
      slug: 'allyship-card-game',
      name: 'Create the Mastering the Game of Allyship Card Game',
      domainType: 'business',
      campaignRef: 'allyship-card-game',
      primaryCampaignDomain: 'DIRECT_ACTION',
      allyshipDomain: 'DIRECT_ACTION',
      parentInstanceId: nonprofit.id,
      linkedInstanceId: null,
      sourceInstanceId: sourceId,
      targetDescription: 'Create the Mastering the Game of Allyship card game. Direct action creative project.',
    },
  })
  console.log(`  ✓ allyship-card-game (sub-campaign) — ${cardGame.id}`)

  const fundraising = await db.instance.upsert({
    where: { slug: 'allyship-fundraising' },
    update: {
      primaryCampaignDomain: 'GATHERING_RESOURCES',
      allyshipDomain: 'GATHERING_RESOURCES',
      parentInstanceId: nonprofit.id,
      linkedInstanceId: linkedId,
      sourceInstanceId: sourceId,
    },
    create: {
      slug: 'allyship-fundraising',
      name: 'Mastering the Game of Allyship Fundraising',
      domainType: 'fundraiser',
      campaignRef: 'allyship-fundraising',
      primaryCampaignDomain: 'GATHERING_RESOURCES',
      allyshipDomain: 'GATHERING_RESOURCES',
      parentInstanceId: nonprofit.id,
      linkedInstanceId: linkedId,
      sourceInstanceId: sourceId,
      targetDescription: 'Fundraising for Mastering the Game of Allyship. Linked to Bruised Banana Residency.',
    },
  })
  console.log(`  ✓ allyship-fundraising (sub-campaign, linked to bruised-banana) — ${fundraising.id}`)

  // 4. Add owner memberships if ALLYSHIP_OWNER_EMAIL or ALLYSHIP_OWNER_NAME set
  const ownerEmail = process.env.ALLYSHIP_OWNER_EMAIL?.trim()
  const ownerName = process.env.ALLYSHIP_OWNER_NAME?.trim()

  if (ownerEmail || ownerName) {
    let owner = null
    if (ownerEmail) {
      const account = await db.account.findFirst({
        where: { email: { equals: ownerEmail, mode: 'insensitive' } },
        include: { players: { take: 1 } },
      })
      owner = account?.players[0]
    }
    if (!owner && ownerName) {
      owner = await db.player.findFirst({
        where: { name: { equals: ownerName, mode: 'insensitive' } },
      })
    }
    if (owner) {
      const instances = [nonprofit, book, cardGame, fundraising]
      for (const inst of instances) {
        await db.instanceMembership.upsert({
          where: {
            instanceId_playerId: { instanceId: inst.id, playerId: owner.id },
          },
          update: { roleKey: 'owner' },
          create: {
            instanceId: inst.id,
            playerId: owner.id,
            roleKey: 'owner',
          },
        })
      }
      console.log(`  ✓ Added ${owner.name} as owner for all 4 instances`)
    } else {
      console.log('  ⏭ ALLYSHIP_OWNER_EMAIL or ALLYSHIP_OWNER_NAME set but no matching player found. Create player first.')
    }
  } else {
    console.log('  ⏭ Set ALLYSHIP_OWNER_EMAIL or ALLYSHIP_OWNER_NAME to add Carolyn as owner.')
  }

  console.log('\n✅ Allyship instances seeded.')
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
