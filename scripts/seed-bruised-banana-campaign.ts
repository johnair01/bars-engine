#!/usr/bin/env npx tsx
/**
 * Seed Bruised Banana campaign record — backfills BB as the reference
 * implementation of the Campaign self-serve data model (L1+L2).
 *
 * Creates:
 *   1. Campaign record (slug: bruised-banana) under the BB residency Instance
 *   2. CampaignTheme record with the canonical BB poster aesthetic
 *      (deep indigo, pixel yellow, retro arcade — matches campaign-skin.ts)
 *   3. Assigns steward: first admin player found, or first player
 *
 * The campaign is created in LIVE status since BB is the existing active
 * reference campaign. The theme mirrors BRUISED_BANANA_SKIN from
 * src/lib/ui/campaign-skin.ts so the DB-driven path produces identical
 * output to the hardcoded path.
 *
 * Idempotent: uses upsert on Campaign.slug and CampaignTheme.campaignId.
 *
 * Run:  npm run seed:bb-campaign
 * Or:   npx tsx scripts/with-env.ts "npx tsx scripts/seed-bruised-banana-campaign.ts"
 *
 * @see .specify/specs/campaign-self-serve/spec.md
 * @see src/lib/ui/campaign-skin.ts (BRUISED_BANANA_SKIN)
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { BB_THEME_DATA } from '../src/lib/ui/theme-presets'

// ---------------------------------------------------------------------------
// Constants — canonical Bruised Banana identity
// ---------------------------------------------------------------------------

const BB_SLUG = 'bruised-banana'
const BB_NAME = 'The Bruised Banana'
const BB_DOMAIN = 'GATHERING_RESOURCES'

const BB_DESCRIPTION = `The Bruised Banana is a birthday residency fundraiser — a 30-day creative campaign to raise funds through allyship, storytelling, and community action. Wake up to what's at stake, clean up what blocks you, grow your capacity, and show up for the mission.`

const BB_WAKE_UP = `See and name what makes this moment critical. The Bruised Banana house needs $3,000 in 30 days — and the urgency is real. What's at stake for you?`

const BB_SHOW_UP = `Contribute to the campaign. Donate, share the story, bring one person in, or complete a quest that moves the needle.`

const BB_STORY_BRIDGE = `Every quest you complete in-game maps to real-world impact. The BARs you earn represent genuine allyship — gathering resources, raising awareness, taking direct action, and organizing skillfully. The game creates the game.`

// L1: Quest template configuration — references template keys from QuestTemplate
const BB_QUEST_TEMPLATE_CONFIG = {
  v: 1,
  templates: [
    { templateKey: 'onboarding-welcome', overrides: { title: 'Join the Residency' } },
    { templateKey: 'fundraiser-pledge', overrides: { title: 'Make a Pledge' } },
  ],
}

// L1: Invite configuration
const BB_INVITE_CONFIG = {
  v: 1,
  method: 'link',
  capacity: 0, // unlimited
  messaging: {
    subject: "You're invited to The Bruised Banana",
    body: 'Join the 30-day birthday residency fundraiser. Every move counts.',
  },
}

// L2: Theme — imported from shared theme-presets (single source of truth)
const BB_THEME = BB_THEME_DATA

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find the BB residency instance (primary instance for the campaign) */
async function findBBInstance() {
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

/** Find a steward player — first admin, then first player */
async function findStewardPlayer() {
  const admin = await db.player.findFirst({
    where: { roles: { some: { role: { key: 'admin' } } } },
    select: { id: true, name: true },
  })
  if (admin) return admin

  const fallback = await db.player.findFirst({
    select: { id: true, name: true },
  })
  return fallback
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🍌 Seeding Bruised Banana Campaign record...\n')

  // 1. Find the parent Instance
  const instance = await findBBInstance()
  if (!instance) {
    console.error(
      '❌ No Bruised Banana instance found (campaignRef "bruised-banana" or slug "bruised-banana" / "bb-bday-001").\n' +
      '   Run `npm run seed:quest-map` or `npm run seed:party` first to create the instance.',
    )
    process.exit(1)
  }
  console.log(`  Instance: ${instance.name} (${instance.slug}) — ${instance.id}`)

  // 2. Find a steward player (creator)
  const steward = await findStewardPlayer()
  if (!steward) {
    console.error('❌ No players found. Create a player first (e.g. sign up).')
    process.exit(1)
  }
  console.log(`  Steward:  ${steward.name ?? 'unnamed'} — ${steward.id}`)

  // 3. Upsert Campaign
  const campaign = await db.campaign.upsert({
    where: { slug: BB_SLUG },
    update: {
      name: BB_NAME,
      description: BB_DESCRIPTION,
      allyshipDomain: BB_DOMAIN,
      wakeUpContent: BB_WAKE_UP,
      showUpContent: BB_SHOW_UP,
      storyBridgeCopy: BB_STORY_BRIDGE,
      questTemplateConfig: BB_QUEST_TEMPLATE_CONFIG,
      inviteConfig: BB_INVITE_CONFIG,
      // Keep existing status on update — don't regress a LIVE campaign
      instanceId: instance.id,
    },
    create: {
      slug: BB_SLUG,
      name: BB_NAME,
      description: BB_DESCRIPTION,
      status: 'LIVE', // BB is the active reference implementation
      allyshipDomain: BB_DOMAIN,
      wakeUpContent: BB_WAKE_UP,
      showUpContent: BB_SHOW_UP,
      storyBridgeCopy: BB_STORY_BRIDGE,
      questTemplateConfig: BB_QUEST_TEMPLATE_CONFIG,
      inviteConfig: BB_INVITE_CONFIG,
      narrativeConfig: null, // L3 reserved
      startDate: instance.startDate,
      endDate: instance.endDate,
      instanceId: instance.id,
      createdById: steward.id,
      shareUrl: `/campaign/${BB_SLUG}`,
    },
  })

  console.log(`  Campaign: ${campaign.name} (${campaign.slug}) — ${campaign.id}`)
  console.log(`  Status:   ${campaign.status}`)

  // 4. Upsert CampaignTheme (L2 visual skin)
  const theme = await db.campaignTheme.upsert({
    where: { campaignId: campaign.id },
    update: {
      bgGradient: BB_THEME.bgGradient,
      bgDeep: BB_THEME.bgDeep,
      titleColor: BB_THEME.titleColor,
      accentPrimary: BB_THEME.accentPrimary,
      accentSecondary: BB_THEME.accentSecondary,
      accentTertiary: BB_THEME.accentTertiary,
      fontDisplayKey: BB_THEME.fontDisplayKey,
      posterImageUrl: BB_THEME.posterImageUrl,
      cssVarOverrides: BB_THEME.cssVarOverrides,
      narrativeConfig: null, // L3 reserved
    },
    create: {
      campaignId: campaign.id,
      bgGradient: BB_THEME.bgGradient,
      bgDeep: BB_THEME.bgDeep,
      titleColor: BB_THEME.titleColor,
      accentPrimary: BB_THEME.accentPrimary,
      accentSecondary: BB_THEME.accentSecondary,
      accentTertiary: BB_THEME.accentTertiary,
      fontDisplayKey: BB_THEME.fontDisplayKey,
      posterImageUrl: BB_THEME.posterImageUrl,
      cssVarOverrides: BB_THEME.cssVarOverrides,
      narrativeConfig: null, // L3 reserved
    },
  })

  console.log(`  Theme:    ${theme.id} (L2 skin applied)`)

  // 5. Summary
  console.log('\n✅ Bruised Banana campaign seeded successfully.')
  console.log('   ├─ Campaign slug:    bruised-banana')
  console.log(`   ├─ Instance:         ${instance.slug}`)
  console.log(`   ├─ Status:           ${campaign.status}`)
  console.log('   ├─ Theme:            deep indigo / pixel yellow / retro arcade')
  console.log('   ├─ L1 config:        quest templates + invite config')
  console.log('   ├─ L2 skin:          CampaignTheme with full CSS var overrides')
  console.log('   └─ L3 narrative:     reserved (null)')
}

main()
  .catch((err) => {
    console.error('💥 Seed failed:', err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
