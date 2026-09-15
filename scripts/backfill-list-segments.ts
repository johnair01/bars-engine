/**
 * Copy the people who signed up before the Resend list existed into their
 * segments, so the first Broadcast reaches them.
 *
 *   npx tsx scripts/backfill-list-segments.ts           # dry run: counts only
 *   npx tsx scripts/backfill-list-segments.ts --apply   # writes to Resend
 *
 * Reads Postgres (the live database, via .env.local) and writes only to Resend.
 * Nothing in Postgres changes. Safe to run twice: an existing contact is added
 * to its segment and its unsubscribe flag is left as it is.
 *
 * Three segments are backfilled: character sheet, succession, nonprofit. Each
 * page promised later mail when these people signed up.
 *
 * Introductions are left out on purpose. Until the consent label changed, the
 * box said "You can write back to me about this lead. Used for the tour and
 * nothing else." A tick under that label agreed to a reply about one place,
 * which is narrower than a mailing list. Only ticks under the new label, "Add
 * me to your mailing list too," put anyone on the list, and the action handles
 * those as they arrive.
 */
import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { addToList } from '@/lib/esp/resend-list'
import type { ListSegment } from '@/lib/esp/list-contract'

config({ path: '.env' })
config({ path: '.env.local', override: true })

const BACKFILL: { intent: string; segment: ListSegment }[] = [
  { intent: 'character-sheet', segment: 'character-sheet' },
  { intent: 'succession', segment: 'succession' },
  { intent: 'nonprofit', segment: 'nonprofit' },
]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  const apply = process.argv.includes('--apply')
  if (apply && !(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)) {
    throw new Error('RESEND_API_KEY and EMAIL_FROM are required for --apply. Without them every write is skipped.')
  }

  const db = new PrismaClient()
  try {
    for (const { intent, segment } of BACKFILL) {
      const rows = await db.funnelSignup.findMany({
        where: { intent },
        select: { email: true, name: true },
        orderBy: { createdAt: 'asc' },
      })
      const people = new Map<string, string | null>()
      for (const row of rows) {
        const email = row.email.trim().toLowerCase()
        if (email) people.set(email, row.name?.trim().split(/\s+/)[0] || people.get(email) || null)
      }

      if (!apply) {
        console.log(`${segment}: ${people.size} people would be added`)
        continue
      }

      const tally = { created: 0, existing: 0, unsubscribed: 0, failed: 0 }
      for (const [email, firstName] of people) {
        const result = await addToList({ email, firstName, segment })
        if (!result.ok || result.skipped) tally.failed++
        else if (result.contact.unsubscribed) tally.unsubscribed++
        else if (result.created) tally.created++
        else tally.existing++
        await sleep(1000)
      }
      console.log(`${segment}: ${JSON.stringify(tally)}`)
    }
    if (!apply) console.log('\nDry run. Nothing was written. Re-run with --apply to write to Resend.')
  } finally {
    await db.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
