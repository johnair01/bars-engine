#!/usr/bin/env npx tsx
/**
 * Seed campaign subcampaigns for Bruised Banana.
 *
 * 1. Sets Instance.primaryCampaignDomain = GATHERING_RESOURCES for bruised-banana
 *
 * Subcampaign Adventures and QuestThreads (DIRECT_ACTION, RAISE_AWARENESS, SKILLFUL_ORGANIZING)
 * are deprecated — they were copy-paste templates. Re-enable when domain-specific orientation exists.
 *
 * Run: npm run seed:campaign-subcampaigns
 *
 * @see .specify/specs/campaign-subcampaigns/spec.md
 */

import './require-db-env'
import { db } from '../src/lib/db'

const CAMPAIGN_REF = 'bruised-banana'
const PRIMARY_DOMAIN = 'GATHERING_RESOURCES'

async function main() {
  console.log('🌱 Seeding Campaign Subcampaigns...\n')

  // 1. Set Instance.primaryCampaignDomain for bruised-banana
  const instances = await db.instance.updateMany({
    where: {
      OR: [{ campaignRef: CAMPAIGN_REF }, { slug: CAMPAIGN_REF }],
    },
    data: { primaryCampaignDomain: PRIMARY_DOMAIN },
  })
  if (instances.count > 0) {
    console.log(`  ✓ Set primaryCampaignDomain=${PRIMARY_DOMAIN} for ${instances.count} instance(s)`)
  } else {
    console.log('  ⏭ No instance with campaignRef bruised-banana found (run other seeds first)')
  }

  console.log('\n✅ Campaign subcampaigns seeded.')
  console.log('  (Subcampaign Adventures/threads deprecated until domain-specific orientation exists)')
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
