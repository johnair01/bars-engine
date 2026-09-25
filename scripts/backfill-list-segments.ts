/**
 * Copy the people who signed up before the Resend list existed onto their
 * lists, so the first Broadcast reaches them.
 *
 *   npx tsx scripts/backfill-list-segments.ts           # dry run: counts only
 *   npx tsx scripts/backfill-list-segments.ts --apply   # writes to Resend
 *
 * Reads Postgres (the live database, via .env.local) and writes only to Resend.
 * Nothing in Postgres changes. Safe to run again: an existing contact keeps its
 * unsubscribe flag, and a topic it has already joined once is left alone.
 *
 * Three lists are backfilled: character sheet (a contact only, in no segment),
 * succession and nonprofit (the mailing-list segment, one topic each). Each
 * page promised later mail when these people signed up.
 *
 * Introductions are left out on purpose. Until the consent label changed, the
 * box said "You can write back to me about this lead. Used for the tour and
 * nothing else." A tick under that label agreed to a reply about one place,
 * which is narrower than a mailing list. Only ticks under the new label, "Add
 * me to your mailing list too," put anyone on the list, and the action handles
 * those as they arrive.
 *
 * Before writing, --apply removes the segments the first backfill created on
 * 2026-09-15, when each list had its own segment and the plan's limit of three
 * stopped the run (MAILING_LIST_SIX_FACES.md, Amendment 1). It removes a
 * segment only when both its name and its creation date match that run, so a
 * segment anyone else made stays where it is.
 */
import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { getResend } from '@/lib/email/resend'
import { addToList } from '@/lib/esp/resend-list'
import type { ListName } from '@/lib/esp/list-contract'

config({ path: '.env' })
config({ path: '.env.local', override: true })

const BACKFILL: { intent: string; list: ListName }[] = [
  { intent: 'character-sheet', list: 'character-sheet' },
  { intent: 'succession', list: 'succession' },
  { intent: 'nonprofit', list: 'nonprofit' },
]

/** The first backfill's segment names, from before Amendment 1. */
const FIRST_RUN_SEGMENTS = new Set([
  'character-sheet (quarterly reminder only)',
  'succession',
  'nonprofit founding circle',
  'introductions (ticked the box)',
])
const FIRST_RUN_DAY = '2026-09-15'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function removeFirstRunSegments(): Promise<void> {
  const resend = getResend()
  if (!resend) return
  const listed = await resend.segments.list({ limit: 100 })
  if (listed.error || !listed.data) {
    console.log(`Could not list segments: ${listed.error?.message ?? 'unknown error'}`)
    return
  }
  console.log('Segments in the account before this run:')
  for (const segment of listed.data.data) {
    console.log(`  ${segment.name}  (created ${segment.created_at.slice(0, 10)})`)
  }
  for (const segment of listed.data.data) {
    const fromFirstRun = FIRST_RUN_SEGMENTS.has(segment.name) && segment.created_at.startsWith(FIRST_RUN_DAY)
    if (!fromFirstRun) continue
    const removed = await resend.segments.remove(segment.id)
    console.log(
      removed.error
        ? `  could not remove "${segment.name}": ${removed.error.message}`
        : `  removed "${segment.name}", made by the first backfill`,
    )
    await sleep(1000)
  }
  console.log('')
}

async function main() {
  const apply = process.argv.includes('--apply')
  if (apply && !(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)) {
    throw new Error('RESEND_API_KEY and EMAIL_FROM are required for --apply. Without them every write is skipped.')
  }

  const db = new PrismaClient()
  try {
    if (apply) await removeFirstRunSegments()

    for (const { intent, list } of BACKFILL) {
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
        console.log(`${list}: ${people.size} people would be added`)
        continue
      }

      const tally = { created: 0, existing: 0, unsubscribed: 0, failed: 0 }
      const failures: string[] = []
      for (const [email, firstName] of people) {
        const result = await addToList({ email, firstName, list })
        if (!result.ok) {
          tally.failed++
          failures.push(`  ${email}: ${result.error}`)
        } else if (result.skipped) {
          tally.failed++
          failures.push(`  ${email}: skipped (${result.reason})`)
        } else if (result.contact.unsubscribed) tally.unsubscribed++
        else if (result.created) tally.created++
        else tally.existing++
        await sleep(1000)
      }
      console.log(`${list}: ${JSON.stringify(tally)}`)
      if (failures.length) console.log(failures.join('\n'))
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
