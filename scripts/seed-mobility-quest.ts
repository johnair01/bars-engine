import './require-db-env'
import { db } from '../src/lib/db'

/**
 * Seed the Mobility Quest campaign's milestones + superpower-typed needs.
 * Spec: .specify/specs/mobility-quest-superpower-campaign/spec.md
 *
 * Keyed by `campaignRef` only (no Campaign/Instance row required — milestones and
 * needs are campaignRef-denormalized). Idempotent: deterministic ids upserted;
 * re-running preserves milestone `currentValue` and need `status`/claimant.
 *
 * Apply the migration first:  npm run db:migrate:deploy
 * Then run:                   npm run seed:mobility-quest
 */
const CAMPAIGN_REF = 'mobility-quest'

type MilestoneSeed = {
  id: string
  title: string
  description: string
  targetValue: number
}

const MILESTONES: MilestoneSeed[] = [
  { id: 'mq-ms-move-fund', title: 'Fund the move', description: 'Raise the runway to get out of Portland and land the launch.', targetValue: 2400 },
  { id: 'mq-ms-housing', title: 'Find housing leads in the new city', description: 'Real leads from real people.', targetValue: 5 },
  { id: 'mq-ms-launch-story', title: 'Build the launch story', description: 'Help the world understand why this move matters.', targetValue: 4 },
  { id: 'mq-ms-tend-people', title: 'Tend the people doing the work', description: 'Inner work + care so the crew does not burn out.', targetValue: 6 },
]

type NeedSeed = {
  id: string
  milestoneId: string
  superpower: 'connector' | 'storyteller' | 'strategist' | 'disruptor' | 'alchemist' | 'escape_artist' | 'coach'
  orientation: 'internal' | 'external'
  cardId: string
  unit: 'action' | 'currency' | 'hours'
  value: number
  title: string
}

// Spans all 7 superpowers, both orientations, and all 3 units.
const NEEDS: NeedSeed[] = [
  { id: 'mq-need-connector-intro', milestoneId: 'mq-ms-housing', superpower: 'connector', orientation: 'external', cardId: 'WAKE-GR-DIPLOMAT', unit: 'action', value: 1, title: 'Make a warm intro to someone in the new city' },
  { id: 'mq-need-connector-inner', milestoneId: 'mq-ms-tend-people', superpower: 'connector', orientation: 'internal', cardId: 'WAKE-RA-SHAMAN', unit: 'action', value: 1, title: 'Map which relationships actually sustain you' },
  { id: 'mq-need-storyteller-post', milestoneId: 'mq-ms-launch-story', superpower: 'storyteller', orientation: 'external', cardId: 'WAKE-RA-CHALLENGER', unit: 'action', value: 1, title: 'Draft a post that helps people care about the move' },
  { id: 'mq-need-strategist-plan', milestoneId: 'mq-ms-launch-story', superpower: 'strategist', orientation: 'external', cardId: 'WAKE-GR-REGENT', unit: 'action', value: 1, title: 'Sketch the moving-week plan' },
  { id: 'mq-need-strategist-hours', milestoneId: 'mq-ms-housing', superpower: 'strategist', orientation: 'external', cardId: 'WAKE-GR-ARCHITECT', unit: 'hours', value: 2, title: 'Offer 2 hours to research neighborhoods' },
  { id: 'mq-need-fund', milestoneId: 'mq-ms-move-fund', superpower: 'strategist', orientation: 'external', cardId: 'WAKE-GR-REGENT', unit: 'currency', value: 50, title: 'Chip in toward the move fund' },
  { id: 'mq-need-coach-callup', milestoneId: 'mq-ms-tend-people', superpower: 'coach', orientation: 'external', cardId: 'WAKE-GR-SHAMAN', unit: 'action', value: 1, title: 'Call one person up to their next honest step' },
  { id: 'mq-need-alchemist-grief', milestoneId: 'mq-ms-tend-people', superpower: 'alchemist', orientation: 'internal', cardId: 'WAKE-RA-SAGE', unit: 'action', value: 1, title: 'Metabolize the grief of leaving before you pack' },
  { id: 'mq-need-escape-close', milestoneId: 'mq-ms-tend-people', superpower: 'escape_artist', orientation: 'external', cardId: 'WAKE-RA-CHALLENGER', unit: 'action', value: 1, title: 'Help close out an old commitment cleanly' },
  { id: 'mq-need-disruptor-bottleneck', milestoneId: 'mq-ms-launch-story', superpower: 'disruptor', orientation: 'external', cardId: 'WAKE-RA-CHALLENGER', unit: 'action', value: 1, title: 'Name the bottleneck blocking the launch' },
]

async function seed() {
  console.log('--- Seeding Mobility Quest (milestones + superpower needs) ---')

  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for proposedByPlayerId — seed players first.')

  for (const m of MILESTONES) {
    await db.campaignMilestone.upsert({
      where: { id: m.id },
      // Preserve currentValue on re-seed; only (re)set structural fields.
      update: { campaignRef: CAMPAIGN_REF, title: m.title, description: m.description, targetValue: m.targetValue, status: 'active' },
      create: { id: m.id, campaignRef: CAMPAIGN_REF, title: m.title, description: m.description, targetValue: m.targetValue, status: 'active', proposedByPlayerId: creator.id },
    })
    console.log(`✅ milestone ${m.id}: ${m.title}`)
  }

  for (const n of NEEDS) {
    await db.milestoneNeed.upsert({
      where: { id: n.id },
      // Preserve status + claimant on re-seed; only (re)set structural fields.
      update: { milestoneId: n.milestoneId, campaignRef: CAMPAIGN_REF, superpower: n.superpower, orientation: n.orientation, cardId: n.cardId, unit: n.unit, value: n.value, title: n.title },
      create: { id: n.id, milestoneId: n.milestoneId, campaignRef: CAMPAIGN_REF, superpower: n.superpower, orientation: n.orientation, cardId: n.cardId, unit: n.unit, value: n.value, title: n.title, status: 'open' },
    })
    console.log(`  • need ${n.id}: ${n.superpower}/${n.orientation} (${n.unit}${n.value !== 1 ? ` ${n.value}` : ''})`)
  }

  console.log(`✅ Mobility Quest seeded: ${MILESTONES.length} milestones, ${NEEDS.length} needs (ref=${CAMPAIGN_REF}).`)
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
