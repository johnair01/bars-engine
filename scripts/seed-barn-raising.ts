import './require-db-env'
import { db } from '../src/lib/db'
import { BARN_CAMPAIGN_REF, BARN_WALLS } from '../src/lib/event/barn-raising'

/**
 * Seed the July-18 barn-raising: one event `Instance` + three wall `CampaignMilestone`
 * rows (car / pre-sale / runway), sharing `BARN_CAMPAIGN_REF`.
 *
 * Idempotent: deterministic ids (`barn-wall-<key>`) upserted; re-running preserves
 * `currentValue` (raised totals are not reset). Targets stored in **dollars** to match the
 * donation path (`donate.ts` increments `currentValue` by dollars).
 *
 * Spec: .specify/specs/barn-raising-live-data/spec.md
 */
const INSTANCE_SLUG = 'mtgoa-barn-raising'
const EVENT_DATE = new Date('2026-07-18T00:00:00.000Z')

// One-time walls (car + pre-sale) form the Instance headline goal; runway is monthly.
const ONE_TIME_GOAL_CENTS = BARN_WALLS.filter((w) => w.cadence === 'once').reduce(
  (sum, w) => sum + w.targetCents,
  0,
)

async function seed() {
  console.log('--- Seeding Barn Raising (event instance + 3 wall milestones) ---')

  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for proposedByPlayerId')
  const createdById = creator.id

  const instance = await db.instance.upsert({
    where: { slug: INSTANCE_SLUG },
    update: {
      name: 'Mastering the Game of Allyship — Launch + Barn Raising',
      campaignRef: BARN_CAMPAIGN_REF,
      isEventMode: true,
      goalAmountCents: ONE_TIME_GOAL_CENTS,
      startDate: EVENT_DATE,
      endDate: EVENT_DATE,
    },
    create: {
      slug: INSTANCE_SLUG,
      name: 'Mastering the Game of Allyship — Launch + Barn Raising',
      domainType: 'gathering_resources',
      campaignRef: BARN_CAMPAIGN_REF,
      isEventMode: true,
      goalAmountCents: ONE_TIME_GOAL_CENTS,
      startDate: EVENT_DATE,
      endDate: EVENT_DATE,
    },
  })
  console.log(`✅ Instance: ${instance.name} (${instance.id}) ref=${BARN_CAMPAIGN_REF} goal=$${ONE_TIME_GOAL_CENTS / 100}`)

  for (const wall of BARN_WALLS) {
    const id = `barn-wall-${wall.key}`
    const targetDollars = wall.targetCents / 100
    const milestone = await db.campaignMilestone.upsert({
      where: { id },
      // Preserve currentValue on re-seed — only (re)set the structural fields.
      update: {
        campaignRef: BARN_CAMPAIGN_REF,
        title: wall.name,
        description: wall.blurb,
        targetValue: targetDollars,
        wallKey: wall.key,
        status: 'active',
      },
      create: {
        id,
        campaignRef: BARN_CAMPAIGN_REF,
        title: wall.name,
        description: wall.blurb,
        targetValue: targetDollars,
        wallKey: wall.key,
        status: 'active',
        proposedByPlayerId: createdById,
      },
      select: { id: true, wallKey: true, targetValue: true, currentValue: true },
    })
    const cadence = wall.cadence === 'month' ? '/mo' : ''
    console.log(
      `✅ Wall ${milestone.wallKey}: target $${milestone.targetValue}${cadence}, raised $${milestone.currentValue}${cadence} (${milestone.id})`,
    )
  }

  console.log('✅ Barn raising seeded.')
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
