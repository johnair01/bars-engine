import './require-db-env'
import { db } from '../src/lib/db'
import { getAppConfig } from '../src/actions/config'

// Placeholder URLs so the donation page shows provider links for certification.
// Admins replace these with real links in Admin → Instances.
const PLACEHOLDER_DONATION_URLS = {
  venmoUrl: 'https://venmo.com/u/BruisedBananaResidency',
  cashappUrl: 'https://cash.app/$BruisedBanana',
  paypalUrl: 'https://paypal.me/BruisedBananaResidency',
  stripeOneTimeUrl: 'https://buy.stripe.com/configure-in-admin', // Admin replaces with real Stripe payment link
}

async function seed() {
  console.log('--- Seeding Event Donation Honor System Certification Quest ---')

  // Ensure active/event instance has donation URLs so the donation page shows provider links
  const config = await getAppConfig()
  const activeId = (config as { activeInstanceId?: string | null }).activeInstanceId
  const instance = activeId
    ? await db.instance.findUnique({ where: { id: activeId } })
    : await db.instance.findFirst({ where: { isEventMode: true }, orderBy: { createdAt: 'desc' } })

  if (instance) {
    await db.instance.update({
      where: { id: instance.id },
      data: PLACEHOLDER_DONATION_URLS,
    })
    console.log(`✅ Instance "${instance.name}" updated with donation URLs for certification`)
  } else {
    console.log('⚠️ No active/event instance found; donation page may not show provider links until one is configured')
  }

  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for createdById')
  const createdById = creator.id

  const title = 'Certification: Event Donation Honor System V1'
  const slug = 'cert-event-donation-honor-v1'

  const passages = [
    {
      name: 'START',
      pid: '1',
      text: 'This certification quest verifies the event donation honor system: public event page, donation page with provider links, self-report flow, and vibeulons minted to the wallet after self-report.',
      cleanText: 'This certification quest verifies the event donation honor system: public event page, donation page with provider links, self-report flow, and vibeulons minted to the wallet after self-report.',
      links: [{ label: 'Begin', target: 'STEP_1' }],
    },
    {
      name: 'STEP_1',
      pid: '2',
      text: '### Step 1: Public event page\n\n[Open /event](/event) (logged out). Confirm the event page loads without redirect. You should see Wake Up, Show Up, and a Donate button.',
      cleanText: '### Step 1: Public event page\n\n[Open /event](/event) (logged out). Confirm the event page loads without redirect. You should see Wake Up, Show Up, and a Donate button.',
      links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }],
    },
    {
      name: 'STEP_2',
      pid: '3',
      text: '### Step 2: Contribution flow\n\nOpen [/event/donate/wizard](/event/donate/wizard) (guided paths), then continue to the direct page for payment links and self-report. Confirm you see provider links (Venmo, Cash App, PayPal, Stripe) if configured, and a "Self-report donation" form.',
      cleanText: '### Step 2: Contribution flow\n\nOpen [/event/donate/wizard](/event/donate/wizard) (guided paths), then continue to the direct page for payment links and self-report. Confirm you see provider links (Venmo, Cash App, PayPal, Stripe) if configured, and a "Self-report donation" form.',
      links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }],
    },
    {
      name: 'STEP_3',
      pid: '4',
      text: '### Step 3: Self-report (logged in)\n\nLog in, then enter an amount (e.g. $5) in the self-report form and submit. Confirm you receive a success message and vibeulons are minted (see wallet balance).',
      cleanText: '### Step 3: Self-report (logged in)\n\nLog in, then enter an amount (e.g. $5) in the self-report form and submit. Confirm you receive a success message and vibeulons are minted (see wallet balance).',
      links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }],
    },
    {
      name: 'STEP_4',
      pid: '5',
      text: '### Step 4: Wallet balance\n\n[Open your Wallet](/wallet). Confirm your ♦ total reflects the donation (vibeulons mint when self-report succeeds — no separate redeem step).',
      cleanText: '### Step 4: Wallet balance\n\n[Open your Wallet](/wallet). Confirm your ♦ total reflects the donation (vibeulons mint when self-report succeeds — no separate redeem step).',
      links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }],
    },
    {
      name: 'FEEDBACK',
      pid: '7',
      text: "### Report an Issue\n\nSomething isn't working as expected? Describe what you encountered so we can fix it.",
      cleanText: "### Report an Issue\n\nSomething isn't working as expected? Describe what you encountered so we can fix it.",
      links: [],
      tags: ['feedback'],
    },
    {
      name: 'END_SUCCESS',
      pid: '6',
      text: 'Verification complete. You have confirmed the event donation honor system: public event page, donation links, self-report flow, and vibeulons minted after self-report. Complete this quest to receive your vibeulon reward.',
      cleanText: 'Verification complete. You have confirmed the event donation honor system: public event page, donation links, self-report flow, and vibeulons minted after self-report. Complete this quest to receive your vibeulon reward.',
      links: [],
    },
  ]

  const parsedJson = JSON.stringify({
    title,
    startPassage: 'START',
    passages,
  })

  const story = await db.twineStory.upsert({
    where: { slug },
    update: {
      title,
      parsedJson,
      isPublished: true,
    },
    create: {
      title,
      slug,
      sourceType: 'manual_seed',
      sourceText: 'Event donation honor system certification quest (seed-event-donation-honor-cert.ts)',
      parsedJson,
      isPublished: true,
      createdById,
    },
  })

  const quest = await db.customBar.upsert({
    where: { id: slug },
    update: {
      title,
      description: 'Step-by-step verification of the event donation honor system: public event page, donation page, self-report flow, and vibeulons minted to wallet.',
      reward: 1,
      twineStoryId: story.id,
      status: 'active',
      visibility: 'public',
      isSystem: true,
    },
    create: {
      id: slug,
      title,
      description: 'Step-by-step verification of the event donation honor system: public event page, donation page, self-report flow, and vibeulons minted to wallet.',
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
  console.log('✅ Event Donation Honor Certification Quest seeded.')
}

seed().catch(console.error)
