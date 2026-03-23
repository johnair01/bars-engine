#!/usr/bin/env npx tsx
/**
 * Seed Bruised Banana **house coordination** instance (backlog Y).
 *
 * - Upserts Instance slug `bruised-banana-house`, campaignRef `bruised-banana-house`.
 * - Sets parent to primary BB residency instance when found (campaignRef or slugs).
 * - Optional: BB_HOUSE_MEMBER_EMAILS=comma@separated — matches Player.contactValue where contactType is email.
 *
 * Run: npm run seed:bb-house
 * Or:  npx tsx scripts/with-env.ts "npx tsx scripts/seed-bruised-banana-house-instance.ts"
 *
 * @see .specify/specs/bruised-banana-house-instance/spec.md
 */

import './require-db-env'
import { db } from '../src/lib/db'

const HOUSE_SLUG = 'bruised-banana-house'
const HOUSE_CAMPAIGN_REF = 'bruised-banana-house'

const WAKE_UP = `This instance is for coordinating the physical Bruised Banana house — systems, care rounds, and shared responsibility. It sits alongside the residency fundraiser; use the four moves to name what's present and what wants to move.`

const TARGET =
  'House health: skillful organizing and direct action on the ground. Link quests and BARs here when the work is about the shared space and its rhythms.'

function houseGoalDataJson() {
  return JSON.stringify({
    v: 1,
    schema: 'bruised-banana-house-state-v1',
    house: {
      note: 'Placeholder for recurring completions + health signals (Y phase 2).',
      seededAt: new Date().toISOString(),
    },
  })
}

async function findBruisedBananaResidency() {
  return db.instance.findFirst({
    where: {
      OR: [
        { campaignRef: 'bruised-banana' },
        { slug: 'bruised-banana' },
        { slug: 'bb-bday-001' },
      ],
    },
    orderBy: { updatedAt: 'desc' },
  })
}

async function main() {
  console.log('🌱 Seeding Bruised Banana House instance (Y)...\n')

  const parent = await findBruisedBananaResidency()
  if (parent) {
    console.log(`  Found BB residency parent: ${parent.name} (${parent.slug}) — ${parent.id}`)
  } else {
    console.warn(
      '  ⚠ No Bruised Banana residency instance found (campaignRef bruised-banana or slugs bruised-banana / bb-bday-001). House row will have parentInstanceId = null. Run quest-map or party seed first if you need a parent link.',
    )
  }

  const house = await db.instance.upsert({
    where: { slug: HOUSE_SLUG },
    update: {
      name: 'Bruised Banana House',
      campaignRef: HOUSE_CAMPAIGN_REF,
      domainType: 'house',
      primaryCampaignDomain: 'SKILLFUL_ORGANIZING',
      allyshipDomain: 'SKILLFUL_ORGANIZING',
      parentInstanceId: parent?.id ?? null,
      isEventMode: false,
      kotterStage: 1,
      wakeUpContent: WAKE_UP,
      targetDescription: TARGET,
      narrativeKernel:
        'Physical house coordination for the residency — Wendell, Eddy, JJ, and community; parallel to fundraiser instance.',
      goalData: houseGoalDataJson(),
    },
    create: {
      slug: HOUSE_SLUG,
      name: 'Bruised Banana House',
      campaignRef: HOUSE_CAMPAIGN_REF,
      domainType: 'house',
      primaryCampaignDomain: 'SKILLFUL_ORGANIZING',
      allyshipDomain: 'SKILLFUL_ORGANIZING',
      parentInstanceId: parent?.id ?? null,
      isEventMode: false,
      kotterStage: 1,
      wakeUpContent: WAKE_UP,
      targetDescription: TARGET,
      narrativeKernel:
        'Physical house coordination for the residency — Wendell, Eddy, JJ, and community; parallel to fundraiser instance.',
      goalData: houseGoalDataJson(),
    },
  })

  console.log(`  ✓ ${house.name} (${house.slug}) — ${house.id}`)
  console.log(`    campaignRef=${house.campaignRef} parentInstanceId=${house.parentInstanceId ?? 'null'}`)

  const raw = process.env.BB_HOUSE_MEMBER_EMAILS?.trim()
  if (raw) {
    const emails = [...new Set(raw.split(/[\s,]+/).map((s) => s.trim().toLowerCase()).filter(Boolean))]
    console.log(`\n  Instance memberships (${emails.length} email(s))...`)
    for (const email of emails) {
      const player = await db.player.findFirst({
        where: {
          contactType: 'email',
          contactValue: { equals: email, mode: 'insensitive' },
        },
      })
      if (!player) {
        console.warn(`    ⚠ No player with contact email "${email}" — skip`)
        continue
      }
      await db.instanceMembership.upsert({
        where: {
          instanceId_playerId: { instanceId: house.id, playerId: player.id },
        },
        update: { roleKey: 'house_operator' },
        create: {
          instanceId: house.id,
          playerId: player.id,
          roleKey: 'house_operator',
        },
      })
      console.log(`    ✓ ${player.name} (${email})`)
    }
  } else {
    console.log('\n  (Set BB_HOUSE_MEMBER_EMAILS to add InstanceMembership rows for operators.)')
  }

  console.log('\n✅ Bruised Banana House instance seed complete.')
  console.log('   Gameboard/hub with ref=bruised-banana-house when you add quests to this instance.')
  console.log('   Keep AppConfig activeInstance on the fundraiser unless /event should show the house.\n')
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
