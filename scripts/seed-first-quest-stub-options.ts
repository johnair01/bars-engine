/**
 * Seed First Quest Stub options as real campaign deck quests.
 * These are the 6 options from bruised-banana-onboarding-draft First Quest Stub passage.
 * Run: npx tsx scripts/seed-first-quest-stub-options.ts
 */

import './require-db-env'
import { db } from '../src/lib/db'

const CAMPAIGN_REF = 'bruised-banana'
const CAMPAIGN_GOAL = 'Bruised Banana Residency — people showing up'

const FIRST_QUEST_STUB_OPTIONS = [
  {
    id: 'bb-first-strengthen-residency',
    title: 'Strengthen the Residency',
    description:
      'Help secure the resources that keep the Bruised Banana Residency running. Contribute time, skills, or connections that support the residency.',
    allyshipDomain: 'GATHERING_RESOURCES' as const,
    emotionalAlchemyTag: 'aligned' as const,
  },
  {
    id: 'bb-first-invite-aligned',
    title: 'Invite One Aligned Person',
    description:
      'Reach out to one person who might resonate with the Bruised Banana story. Share what drew you in and invite them to explore.',
    allyshipDomain: 'RAISE_AWARENESS' as const,
    emotionalAlchemyTag: 'aligned' as const,
  },
  {
    id: 'bb-first-offer-skill',
    title: 'Offer a Skill or Resource',
    description:
      'Offer something you have—a skill, a resource, a connection—that could support the residency. Name it and make it available.',
    allyshipDomain: 'GATHERING_RESOURCES' as const,
    emotionalAlchemyTag: 'curious' as const,
  },
  {
    id: 'bb-first-share-page',
    title: 'Share the Residency Page',
    description:
      'Share the Bruised Banana Residency page with your network. One post, one message, one conversation—spread the story.',
    allyshipDomain: 'RAISE_AWARENESS' as const,
    emotionalAlchemyTag: 'curious' as const,
  },
  {
    id: 'bb-first-contribute-financially',
    title: 'Contribute Financially',
    description:
      'Support the residency with a financial contribution. Every amount helps the residency continue its work.',
    allyshipDomain: 'GATHERING_RESOURCES' as const,
    emotionalAlchemyTag: 'aligned' as const,
  },
  {
    id: 'bb-first-submit-feedback',
    title: 'Submit Structured Feedback',
    description:
      'Share structured feedback about your experience. What worked? What could improve? Your input shapes the next iteration.',
    allyshipDomain: 'SKILLFUL_ORGANIZING' as const,
    emotionalAlchemyTag: 'skeptical' as const,
  },
]

async function main() {
  console.log('--- Seeding First Quest Stub Options (Bruised Banana) ---')

  const creator = await db.player.findFirst({
    where: { roles: { some: { role: { key: 'admin' } } } },
  })
  if (!creator) {
    console.error('No admin player found. Create an admin first.')
    process.exit(1)
  }

  for (const opt of FIRST_QUEST_STUB_OPTIONS) {
    await db.customBar.upsert({
      where: { id: opt.id },
      update: {
        title: opt.title,
        description: opt.description,
        allyshipDomain: opt.allyshipDomain,
        emotionalAlchemyTag: opt.emotionalAlchemyTag,
        campaignRef: CAMPAIGN_REF,
        campaignGoal: CAMPAIGN_GOAL,
        kotterStage: 1,
        type: 'quest',
        status: 'active',
        visibility: 'public',
        isSystem: true,
        reward: 1,
      },
      create: {
        id: opt.id,
        title: opt.title,
        description: opt.description,
        allyshipDomain: opt.allyshipDomain,
        emotionalAlchemyTag: opt.emotionalAlchemyTag,
        campaignRef: CAMPAIGN_REF,
        campaignGoal: CAMPAIGN_GOAL,
        kotterStage: 1,
        type: 'quest',
        status: 'active',
        visibility: 'public',
        isSystem: true,
        reward: 1,
        creatorId: creator.id,
        inputs: '[]',
      },
    })
    console.log(`  ${opt.title}`)
  }

  console.log('First Quest Stub options seeded. These appear in the campaign deck for period 1.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
