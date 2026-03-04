/**
 * Seed the BAR quest "Increase the quality of the onboarding flow copy"
 *
 * This quest guides admins through a repeatable process: use the AI copy-improvement
 * tool (Improve with AI in EventCampaignEditor) to raise onboarding copy quality.
 * The process is metabolized by the system — same action used by quest, admin UI, cert.
 *
 * Run with: npx tsx scripts/seed-onboarding-copy-quality-quest.ts
 * Or: npm run seed:copy-quality (add to package.json)
 */

import './require-db-env'
import { db } from '../src/lib/db'

const QUEST_ID = 'onboarding-copy-quality-v1'
const SLUG = 'onboarding-copy-quality-v1'

async function seed() {
  console.log('--- Seeding Onboarding Copy Quality Quest ---')

  const creator = await db.player.findFirst({
    where: { roles: { some: { role: { key: 'admin' } } } },
  })
  const createdById = creator?.id ?? (await db.player.findFirst())?.id
  if (!createdById) {
    throw new Error('No player found for createdById')
  }

  const passages = [
    {
      name: 'START',
      pid: '1',
      text: '### Increase the quality of the onboarding flow copy\n\nThis quest guides you through a repeatable process. The **Improve with AI** tool in the Event Campaign Editor uses the Voice Style Guide to refine copy. The same process can be used for any onboarding or campaign text.\n\n**Problem**: Onboarding copy quality blocks player experience. The tools need a repeatable process that integrates with the system.',
      cleanText: 'Increase the quality of the onboarding flow copy. This quest guides you through a repeatable process using Improve with AI.',
      links: [{ label: 'Begin', target: 'STEP_1' }],
    },
    {
      name: 'STEP_1',
      pid: '2',
      text: '### Step 1: Open Event Campaign Editor\n\n[Open the Event page](/event) and click **Edit campaign**. You will see Wake Up, Show Up, Story bridge, Theme, and Target description fields.',
      cleanText: 'Open the Event page and click Edit campaign.',
      links: [{ label: 'Next', target: 'STEP_2' }],
    },
    {
      name: 'STEP_2',
      pid: '3',
      text: '### Step 2: Improve with AI\n\nFor each field (Story bridge, Wake Up, Show Up), click **Improve with AI**. The tool uses the Voice Style Guide to refine the copy. Review the result and apply it (or edit further).',
      cleanText: 'For each field, click Improve with AI. Review and apply.',
      links: [{ label: 'Next', target: 'STEP_3' }],
    },
    {
      name: 'STEP_3',
      pid: '4',
      text: '### Step 3: Save and verify\n\nClick **Save** to persist the changes. Then [open the Event page](/event) in a new tab (or refresh) to verify the updated copy appears correctly.',
      cleanText: 'Save and verify the updated copy on the Event page.',
      links: [{ label: 'Complete', target: 'END_SUCCESS' }],
    },
    {
      name: 'END_SUCCESS',
      pid: '5',
      text: 'You have completed the onboarding copy quality process. This same **Improve with AI** flow can be used for passages, instance copy, and other campaign text. The process is repeatable and metabolized by the system.',
      cleanText: 'Process complete. Improve with AI is available for all campaign copy.',
      links: [],
    },
  ]

  const parsedJson = JSON.stringify({
    title: 'Increase the quality of the onboarding flow copy',
    startPassage: 'START',
    passages,
  })

  const story = await db.twineStory.upsert({
    where: { slug: SLUG },
    update: {
      title: 'Increase the quality of the onboarding flow copy',
      parsedJson,
      isPublished: true,
    },
    create: {
      title: 'Increase the quality of the onboarding flow copy',
      slug: SLUG,
      sourceType: 'manual_seed',
      sourceText: 'Onboarding copy quality quest (seed-onboarding-copy-quality-quest.ts)',
      parsedJson,
      isPublished: true,
      createdById,
    },
  })

  const quest = await db.customBar.upsert({
    where: { id: QUEST_ID },
    update: {
      title: 'Increase the quality of the onboarding flow copy',
      description:
        'Use the Improve with AI tool in Event Campaign Editor to refine onboarding copy. Repeatable process metabolized by the system.',
      reward: 1,
      twineStoryId: story.id,
      status: 'active',
      visibility: 'public',
      isSystem: true,
    },
    create: {
      id: QUEST_ID,
      title: 'Increase the quality of the onboarding flow copy',
      description:
        'Use the Improve with AI tool in Event Campaign Editor to refine onboarding copy. Repeatable process metabolized by the system.',
      creatorId: createdById,
      reward: 1,
      twineStoryId: story.id,
      status: 'active',
      visibility: 'public',
      isSystem: true,
    },
  })

  console.log(`✅ Story seeded: ${story.title} (${story.id})`)
  console.log(`✅ Quest seeded: ${quest.title} (${quest.id})`)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
