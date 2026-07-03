/**
 * Verification quest: cert-humane-notifications-v1
 *
 * Run: npm run seed:cert:humane-notifications
 */
import './require-db-env'
import { db } from '../src/lib/db'

const slug = 'cert-humane-notifications-v1'
const title = 'Certification: Humane Notifications V1'

const passages = [
  {
    name: 'START',
    pid: '1',
    text: 'This certification verifies **humane notifications**: campaign invite email, opt-in daily reminder settings, and unsubscribe — without shame copy.\n\nComplete each step in order.',
    cleanText:
      'This certification verifies humane notifications: campaign invite email, opt-in daily reminder settings, and unsubscribe without shame copy. Complete each step in order.',
    links: [{ label: 'Begin', target: 'STEP_1' }],
  },
  {
    name: 'STEP_1',
    pid: '2',
    text: '### Step 1: Open notification settings\n\nVisit [/settings/notifications](/settings/notifications). Confirm you see toggles for **campaign invitations** and **daily practice reminder** (off by default).',
    cleanText:
      'Step 1: Open notification settings at /settings/notifications. Confirm toggles for campaign invitations and daily practice reminder (off by default).',
    links: [{ label: 'Next', target: 'STEP_2' }],
  },
  {
    name: 'STEP_2',
    pid: '3',
    text: '### Step 2: Opt in to daily reminder\n\nEnable **daily practice reminder**, pick an hour and timezone, save. Confirm copy mentions no streaks.',
    cleanText:
      'Step 2: Opt in to daily practice reminder, pick hour and timezone. Confirm copy mentions no streaks.',
    links: [{ label: 'Next', target: 'STEP_3' }],
  },
  {
    name: 'STEP_3',
    pid: '4',
    text: '### Step 3: Event invite email (if configured)\n\nIf Resend is configured, send an event invitation to a test player and confirm they receive email with a CTA to the invitation BAR. If email is not configured locally, confirm the in-app invitation still appears.',
    cleanText:
      'Step 3: If Resend is configured, send an event invitation and confirm email + in-app invite. Otherwise confirm in-app invite only.',
    links: [{ label: 'Complete verification', target: 'END_SUCCESS' }],
  },
  {
    name: 'END_SUCCESS',
    pid: '5',
    text: 'Verification complete. Guests can receive invitations when away, opt into a gentle daily nudge, and unsubscribe without guilt — party prep for the Bruised Banana Fundraiser. Complete this quest to receive your vibeulon reward.',
    cleanText:
      'Verification complete. Guests can receive invitations when away, opt into a gentle daily nudge, and unsubscribe without guilt. Complete this quest to receive your vibeulon reward.',
    links: [],
  },
]

async function seed() {
  console.log('--- Seeding cert-humane-notifications-v1 ---')

  await db.playerQuest.deleteMany({ where: { questId: slug } })
  await db.twineRun.deleteMany({ where: { questId: slug } })

  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for createdById')

  const parsedJson = JSON.stringify({ title, startPassage: 'START', passages })

  const story = await db.twineStory.upsert({
    where: { slug },
    update: { title, parsedJson, isPublished: true },
    create: {
      title,
      slug,
      sourceType: 'manual_seed',
      sourceText: 'Humane notifications certification (seed-cert-humane-notifications.ts)',
      parsedJson,
      isPublished: true,
      createdById: creator.id,
    },
  })

  const description =
    'Verifies humane notification settings, opt-in daily reminder, and campaign invite email policy per .specify/specs/humane-notifications/.'

  const quest = await db.customBar.upsert({
    where: { id: slug },
    update: {
      title,
      description,
      reward: 1,
      twineStoryId: story.id,
      status: 'active',
      visibility: 'public',
      isSystem: true,
      backlogPromptPath: '.specify/specs/humane-notifications/spec.md',
    },
    create: {
      id: slug,
      title,
      description,
      creatorId: creator.id,
      reward: 1,
      twineStoryId: story.id,
      status: 'active',
      visibility: 'public',
      isSystem: true,
      backlogPromptPath: '.specify/specs/humane-notifications/spec.md',
    },
  })

  console.log(`✅ Story: ${story.id}`)
  console.log(`✅ Quest: ${quest.id}`)
}

seed()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error(err)
    await db.$disconnect()
    process.exit(1)
  })
