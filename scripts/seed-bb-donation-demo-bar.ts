#!/usr/bin/env npx tsx
/**
 * Seed a **stable public BAR** stewards can copy-link for outbound Bruised Banana donation demo outreach.
 *
 *   npm run seed:bb-donation-demo-bar
 *
 * **Stable id:** `bb-donation-demo-outreach` → `/bars/bb-donation-demo-outreach`
 *
 * Idempotent — `upsert` by id. Requires at least one `Player` (prefers admin).
 *
 * @see .specify/specs/bruised-banana-donation-demo-bar/spec.md
 */
import './require-db-env'
import { db } from '../src/lib/db'

const BAR_ID = 'bb-donation-demo-outreach'

const TITLE = 'Bruised Banana — Donation demo (outreach)'

const DESCRIPTION = `**You're invited** to try a short public ritual before you give: name what you feel about fundraisers, walk a 3→2→1 pass, then choose what's next. Nothing is saved on our servers until you sign in elsewhere.

**Start the demo:** [Open /demo/bruised-banana](/demo/bruised-banana)

**Donate** (payment links work without an account; self-report needs sign-in): [/demo/bruised-banana/donate](/demo/bruised-banana/donate)

**Read the campaign:** [/wiki/campaign/bruised-banana](/wiki/campaign/bruised-banana)

Send this card as a link — the house welcomes honest pacing over pressure.`

async function main() {
  const creator =
    (await db.player.findFirst({
      where: { roles: { some: { role: { key: 'admin' } } } },
      select: { id: true },
    })) ?? (await db.player.findFirst({ select: { id: true } }))

  if (!creator) {
    console.error('No player found. Create an account once, then re-run.')
    process.exit(1)
  }

  await db.customBar.upsert({
    where: { id: BAR_ID },
    create: {
      id: BAR_ID,
      creatorId: creator.id,
      title: TITLE,
      description: DESCRIPTION,
      type: 'bar',
      reward: 0,
      visibility: 'public',
      status: 'active',
      inputs: '[]',
      rootId: BAR_ID,
      campaignRef: 'bruised-banana',
      isSystem: true,
      storyContent: 'donation-demo,outreach,bruised-banana',
    },
    update: {
      title: TITLE,
      description: DESCRIPTION,
      type: 'bar',
      visibility: 'public',
      status: 'active',
      campaignRef: 'bruised-banana',
      isSystem: true,
      storyContent: 'donation-demo,outreach,bruised-banana',
    },
  })

  console.log('✅ Bruised Banana donation demo outreach BAR')
  console.log(`   Bar page: /bars/${BAR_ID}`)
  console.log('   Copy the URL or open from Hand → share as needed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
