#!/usr/bin/env npx tsx
/**
 * Seed a public event_invite BAR for CSHE (clothing swap hybrid event).
 *
 *   npx tsx scripts/with-env.ts "npx tsx scripts/seed-clothing-swap-event-invite-bar.ts"
 *
 * Stable id → `/invite/event/cshe-clothing-swap-invite-v1`
 * Instance-specific orientation + RSVP use `/swap-orientation/[slug]` and `/swap-rsvp/[slug]` (replace with your instance slug).
 */
import './require-db-env'
import { db } from '../src/lib/db'
import {
  buildClothingSwapEventInviteStory,
  CSHE_EVENT_INVITE_BAR_ID,
} from '../src/lib/clothing-swap-event-invite-story'
import { EVENT_INVITE_BAR_TYPE } from '../src/lib/event-invite-story/schema'

async function main() {
  const admin =
    (await db.player.findFirst({
      where: { roles: { some: { role: { key: 'admin' } } } },
      select: { id: true },
    })) ?? (await db.player.findFirst({ select: { id: true } }))

  if (!admin) {
    console.error('No player found. Sign up once, then re-run.')
    process.exit(1)
  }

  const story = buildClothingSwapEventInviteStory(
    'Clothing swap fundraiser',
    {},
    { slug: 'your-instance-slug' }
  )

  await db.customBar.upsert({
    where: { id: CSHE_EVENT_INVITE_BAR_ID },
    create: {
      id: CSHE_EVENT_INVITE_BAR_ID,
      creatorId: admin.id,
      title: 'Clothing swap · event doorway (CSHE)',
      description:
        'Generic printable / shareable doorway. For live events, prefer the orientation link with your instance slug from the swap organizer console.',
      type: EVENT_INVITE_BAR_TYPE,
      visibility: 'public',
      status: 'active',
      isSystem: true,
      campaignRef: 'bruised-banana',
      storyContent: JSON.stringify(story),
      reward: 0,
    },
    update: {
      title: 'Clothing swap · event doorway (CSHE)',
      description:
        'Generic printable / shareable doorway. For live events, prefer the orientation link with your instance slug from the swap organizer console.',
      type: EVENT_INVITE_BAR_TYPE,
      visibility: 'public',
      status: 'active',
      storyContent: JSON.stringify(story),
      campaignRef: 'bruised-banana',
    },
  })

  console.log('✅ CSHE event invite BAR ready')
  console.log(`   Stable URL: /invite/event/${CSHE_EVENT_INVITE_BAR_ID}`)
  console.log('   Prefer per-instance: /swap-orientation/<slug> and /swap-rsvp/<slug> (see swap organizer UI).')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
