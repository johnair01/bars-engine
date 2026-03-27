#!/usr/bin/env npx tsx
/**
 * Ensures an active CampaignMilestone exists for Bruised Banana residency (`campaignRef: bruised-banana`)
 * so the donation wizard can link self-reported gifts to fundraising progress (DSW / BBMT).
 *
 * Run: npx tsx scripts/seed-bruised-banana-residency-milestone.ts
 *
 * Safe to re-run — upserts by stable id.
 */
import './require-db-env'
import { db } from '../src/lib/db'

const BB_REF = 'bruised-banana'
const MILESTONE_ID = 'bb-residency-fundraising-v1'

async function main() {
  console.log('🌱 Bruised Banana residency — fundraising milestone\n')

  const instance = await db.instance.findFirst({
    where: { OR: [{ campaignRef: BB_REF }, { slug: BB_REF }] },
    select: {
      id: true,
      name: true,
      goalAmountCents: true,
    },
  })
  if (!instance) {
    console.error('❌ No instance with campaignRef or slug bruised-banana. Seed instances first.')
    process.exit(1)
  }

  const goalDollars =
    instance.goalAmountCents != null && instance.goalAmountCents > 0
      ? instance.goalAmountCents / 100
      : 3000

  const existing = await db.campaignMilestone.findFirst({ where: { id: MILESTONE_ID } })
  const adminPlayer = await db.player.findFirst({
    where: { roles: { some: { role: { key: 'admin' } } } },
    select: { id: true, name: true },
  })
  if (!adminPlayer) {
    console.error('❌ No admin player — cannot create CampaignMilestone (proposedByPlayerId required).')
    process.exit(1)
  }

  if (existing) {
    await db.campaignMilestone.update({
      where: { id: MILESTONE_ID },
      data: {
        title: 'Bruised Banana residency — fundraising',
        description:
          'Honor-system donations self-reported through /event/donate increment this goal when linked in the contribution wizard.',
        targetValue: goalDollars,
        status: 'active',
      },
    })
    console.log(`  ✓ Updated milestone ${MILESTONE_ID} (target ≈ $${goalDollars.toFixed(0)})`)
  } else {
    await db.campaignMilestone.create({
      data: {
        id: MILESTONE_ID,
        campaignRef: BB_REF,
        title: 'Bruised Banana residency — fundraising',
        description:
          'Honor-system donations self-reported through /event/donate increment this goal when linked in the contribution wizard.',
        targetValue: goalDollars,
        currentValue: 0,
        status: 'active',
        proposedByPlayerId: adminPlayer.id,
        approvedByPlayerId: adminPlayer.id,
        approvedAt: new Date(),
      },
    })
    console.log(`  ✓ Created milestone ${MILESTONE_ID} (target ≈ $${goalDollars.toFixed(0)})`)
  }

  console.log('\n✅ Done. Open /event/donate/wizard — Money path should list this milestone.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
