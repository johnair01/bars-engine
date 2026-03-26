#!/usr/bin/env npx tsx
/**
 * Seed the "Keeping Warm" sub-campaign of the Bruised Banana Residency.
 *
 * Creates:
 *   1. Instance: keeping-warm (parentInstanceId → bruised-banana instance)
 *   2. CYOA_INTAKE Adventure: keeping-warm-intake (campaignRef: keeping-warm)
 *   3. CampaignMilestone on BB Residency instance: "Keeping Warm monthly tribute"
 *
 * Run: npx tsx scripts/seed-keeping-warm-campaign.ts
 *
 * Safe to re-run — uses upsert/findFirst with stable ids.
 */
import './require-db-env'
import { db } from '../src/lib/db'

const BB_CAMPAIGN_REF = 'bruised-banana'
const KW_CAMPAIGN_REF = 'keeping-warm'
const KW_SLUG = 'keeping-warm'
const KW_INTAKE_SLUG = 'keeping-warm-intake'
const KW_MILESTONE_ID = 'keeping-warm-monthly-tribute'

async function main() {
  console.log('🌱 Seeding Keeping Warm sub-campaign...\n')

  // 1. Find BB Residency instance
  const bbInstance = await db.instance.findFirst({
    where: { OR: [{ campaignRef: BB_CAMPAIGN_REF }, { slug: BB_CAMPAIGN_REF }] },
    select: { id: true, slug: true, name: true },
  })
  if (!bbInstance) {
    console.error('❌ Bruised Banana instance not found. Run the BB seed script first.')
    process.exit(1)
  }
  console.log(`  ✓ Found BB Residency instance: ${bbInstance.slug} (${bbInstance.id})`)

  // 2. Upsert Keeping Warm Instance
  const kwInstance = await db.instance.upsert({
    where: { slug: KW_SLUG },
    create: {
      slug: KW_SLUG,
      name: 'Keeping Warm',
      domainType: 'campaign',
      theme: 'Portland fusion dance — monthly social and recurring fundraiser for BB Residency',
      campaignRef: KW_CAMPAIGN_REF,
      parentInstanceId: bbInstance.id,
      primaryCampaignDomain: 'GATHERING_RESOURCES',
      narrativeKernel:
        'Keeping Warm is a monthly Portland fusion dance social. Each event is an act of community care — and a fundraiser that flows back to the Bruised Banana Residency. Organizers are stewards, not managers. Dancers are co-creators, not attendees.',
      kotterStage: 1,
      isEventMode: true,
      wakeUpContent:
        'Keeping Warm is a monthly fusion dance social in Portland. It raises money for the Bruised Banana Residency while building the community that makes the residency possible.',
      showUpContent:
        'Help organize, invite people you trust, and show up. Every event is a fundraiser. Every contribution flows upstream.',
    },
    update: {
      parentInstanceId: bbInstance.id,
      theme: 'Portland fusion dance — monthly social and recurring fundraiser for BB Residency',
    },
  })
  const action = kwInstance.parentInstanceId === bbInstance.id ? 'Upserted' : 'Created'
  console.log(`  ✓ ${action} Keeping Warm instance: ${kwInstance.slug} (${kwInstance.id})`)
  console.log(`    parentInstanceId → ${bbInstance.id}`)

  // 3. Upsert CYOA_INTAKE Adventure for keeping-warm
  const intakeAdventure = await db.adventure.upsert({
    where: { slug: KW_INTAKE_SLUG },
    create: {
      slug: KW_INTAKE_SLUG,
      title: 'Keeping Warm — How do you arrive?',
      description:
        'A short orientation that routes you to your Keeping Warm spoke adventure based on how you relate to fusion dance communities.',
      status: 'ACTIVE',
      visibility: 'PUBLIC_ONBOARDING',
      campaignRef: KW_CAMPAIGN_REF,
      adventureType: 'CYOA_INTAKE',
    },
    update: {
      status: 'ACTIVE',
      campaignRef: KW_CAMPAIGN_REF,
    },
  })
  console.log(`  ✓ Upserted CYOA_INTAKE adventure: ${intakeAdventure.slug} (${intakeAdventure.id})`)
  console.log(`    Status: ${intakeAdventure.status} | campaignRef: ${intakeAdventure.campaignRef}`)

  // 4. Upsert CampaignMilestone on BB Residency for Keeping Warm tribute
  const existing = await db.campaignMilestone.findFirst({
    where: { id: KW_MILESTONE_ID },
  })
  let milestone
  if (existing) {
    milestone = await db.campaignMilestone.update({
      where: { id: KW_MILESTONE_ID },
      data: {
        title: 'Keeping Warm monthly tribute',
        description:
          'Tracks aggregate surplus from Keeping Warm events flowing to the Bruised Banana Residency. Each event closes a fundraising arc; proceeds above operating costs are contributed here.',
        status: 'active',
      },
    })
    console.log(`  ✓ Updated CampaignMilestone: ${milestone.id}`)
  } else {
    // Find an admin player to use as proposer (required FK)
    const adminPlayer = await db.player.findFirst({
      where: { roles: { some: { role: { key: 'admin' } } } },
      select: { id: true, name: true },
    })
    if (!adminPlayer) {
      console.error('❌ No admin player found — cannot create CampaignMilestone (proposedByPlayerId required).')
      console.error('   Create an admin player first, then re-run this script.')
      process.exit(1)
    }
    console.log(`  ✓ Using admin player as proposer: ${adminPlayer.name} (${adminPlayer.id})`)

    milestone = await db.campaignMilestone.create({
      data: {
        id: KW_MILESTONE_ID,
        campaignRef: BB_CAMPAIGN_REF,
        title: 'Keeping Warm monthly tribute',
        description:
          'Tracks aggregate surplus from Keeping Warm events flowing to the Bruised Banana Residency. Each event closes a fundraising arc; proceeds above operating costs are contributed here.',
        status: 'active',
        proposedByPlayerId: adminPlayer.id,
      },
    })
    console.log(`  ✓ Created CampaignMilestone: ${milestone.id}`)
  }
  console.log(`    campaignRef: ${milestone.campaignRef}`)

  console.log('\n✅ Keeping Warm sub-campaign seeded.')
  console.log('\nNext steps:')
  console.log(`  1. Open /admin/adventures to find "${intakeAdventure.title}"`)
  console.log(`     → Add intake passages + set startNodeId`)
  console.log(`     → Set playbookTemplate (intake routing weights)`)
  console.log(`  2. Seed spoke adventures with campaignRef: keeping-warm`)
  console.log(`  3. Forge a Keeping Warm event invite BAR from /hand/forge-invitation`)
  console.log(`     → Set eventSlug: keeping-warm`)
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
