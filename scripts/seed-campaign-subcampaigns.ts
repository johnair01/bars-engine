#!/usr/bin/env npx tsx
/**
 * Seed campaign subcampaigns for Bruised Banana.
 *
 * 1. Sets Instance.primaryCampaignDomain = GATHERING_RESOURCES for bruised-banana
 * 2. Creates subcampaign Adventures (RAISE_AWARENESS, DIRECT_ACTION, SKILLFUL_ORGANIZING)
 * 3. Creates QuestThreads for each subcampaign, linked via adventureId
 *
 * Run: npm run seed:campaign-subcampaigns
 * Requires: npm run seed:adventure-templates (for encounter-9-passage template)
 *
 * @see .specify/specs/campaign-subcampaigns/spec.md
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { generateFromTemplate } from '../src/lib/template-library'
import { getSubcampaignDomains } from '../src/lib/campaign-subcampaigns'

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

  // 2. Ensure adventure template exists
  const template = await db.adventureTemplate.findFirst({
    where: { key: 'encounter-9-passage' },
  })
  if (!template) {
    console.error('  ❌ Run npm run seed:adventure-templates first')
    process.exit(1)
  }

  // 3. Create subcampaign Adventures
  const subcampaignDomains = getSubcampaignDomains(PRIMARY_DOMAIN)
  const creator = await db.player.findFirst()

  for (const domain of subcampaignDomains) {
    const existing = await db.adventure.findFirst({
      where: {
        campaignRef: CAMPAIGN_REF,
        subcampaignDomain: domain,
      },
    })

    if (existing) {
      console.log(`  ⏭ Adventure for ${domain} already exists (${existing.slug})`)
    } else {
      const slug = `${CAMPAIGN_REF}-${domain.toLowerCase().replace(/_/g, '-')}`
      const adventure = await generateFromTemplate(template.id, {
        slug,
        title: `Bruised Banana — ${domain.replace(/_/g, ' ')} (draft)`,
        campaignRef: CAMPAIGN_REF,
        subcampaignDomain: domain,
      })
      console.log(`  ✓ Created Adventure: ${adventure.slug} (${domain})`)
    }
  }

  // 4. Create QuestThreads for each subcampaign Adventure
  for (const domain of subcampaignDomains) {
    const adventure = await db.adventure.findFirst({
      where: {
        campaignRef: CAMPAIGN_REF,
        subcampaignDomain: domain,
      },
    })

    if (!adventure) continue

    const threadId = `bruised-banana-orientation-${domain}`
    const existingThread = await db.questThread.findUnique({
      where: { id: threadId },
    })

    if (existingThread) {
      if (existingThread.adventureId !== adventure.id) {
        await db.questThread.update({
          where: { id: threadId },
          data: { adventureId: adventure.id },
        })
        console.log(`  ✓ Updated thread ${threadId} → adventure ${adventure.slug}`)
      } else {
        console.log(`  ⏭ Thread ${threadId} already linked`)
      }
    } else {
      await db.questThread.create({
        data: {
          id: threadId,
          title: `Bruised Banana — ${domain.replace(/_/g, ' ')}`,
          description: `Orientation for the ${domain.replace(/_/g, ' ')} path. Play through to get oriented.`,
          threadType: 'orientation',
          creatorType: 'system',
          creatorId: creator?.id ?? undefined,
          status: 'active',
          adventureId: adventure.id,
        },
      })
      console.log(`  ✓ Created thread ${threadId} → ${adventure.slug}`)
    }
  }

  console.log('\n✅ Campaign subcampaigns seeded.')
  console.log('\nNext: Edit subcampaign Adventures in Admin → Adventures, then Promote to Active.')
  console.log('Players who choose a domain at signup will be assigned the matching orientation thread.')
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
