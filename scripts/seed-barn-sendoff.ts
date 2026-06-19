/**
 * Seed the July 18 "send-off" event for the barn-raising instance so the campaign
 * hub (/event) has a real gathering to RSVP to — completing the Show Up tripod on
 * /event/barn (donate to the car wall · buy from the pre-sale · RSVP to the send-off).
 *
 * Creates one EventCampaign + one main EventArtifact under the barn Instance
 * (slug `mtgoa-barn-raising`), with the host(s) recorded as RSVP_yes. Idempotent.
 *
 * NOTE: /event renders the *active* instance only. For this send-off (and the barn
 * milestone strip) to appear there, the barn instance must be set active in Admin.
 *
 * Run: npm run seed:barn-sendoff   (or: npx tsx scripts/seed-barn-sendoff.ts)
 *
 * @see scripts/seed-barn-raising.ts
 * @see scripts/seed-april4-dance-party.ts (pattern reference)
 */
import './require-db-env'
import { PrismaClient } from '@prisma/client'
import { BARN_CAMPAIGN_REF } from '../src/lib/event/barn-raising'

const db = new PrismaClient()

const INSTANCE_SLUG = 'mtgoa-barn-raising'
const CAMPAIGN_ID = 'EC-MTGOA-BARN-SENDOFF-2026'
const EVENT_ID = 'EVT-MTGOA-BARN-SENDOFF-2026-07-18'

async function main() {
  const instance =
    (await db.instance.findUnique({ where: { slug: INSTANCE_SLUG } })) ??
    (await db.instance.findFirst({ where: { campaignRef: BARN_CAMPAIGN_REF } }))
  if (!instance) {
    console.error(
      `No barn-raising instance found (slug ${INSTANCE_SLUG}). Run: npm run seed:barn first.`,
    )
    process.exit(1)
  }
  const instanceId = instance.id

  // Host = Wendell if present, else any admin, else the first player. Recorded as RSVP_yes.
  const wendell = await db.player.findFirst({
    where: { name: { equals: 'Wendell', mode: 'insensitive' } },
  })
  const admin = await db.player.findFirst({
    where: { roles: { some: { role: { key: 'admin' } } } },
  })
  const creator = wendell ?? admin ?? (await db.player.findFirst())
  if (!creator) {
    console.error('No players in DB — cannot set an event creator/host.')
    process.exit(1)
  }
  const hostIds = [creator.id]

  // July 18, 2026 evening (Pacific). Placeholder window — adjust in Admin/DB once locked.
  const start = new Date('2026-07-18T17:00:00-07:00')
  const end = new Date('2026-07-18T21:00:00-07:00')

  const campaignFields = {
    campaignContext: 'Mastering Allyship — the July 18 barn-raising send-off',
    topic: 'Send-off gathering: raise the barn together',
    primaryDomain: 'GATHERING_RESOURCES',
    productionGrammar: 'kotter',
    status: 'planning',
    instanceId,
    hostActorIds: JSON.stringify(hostIds),
  }
  const campaign = await db.eventCampaign.upsert({
    where: { id: CAMPAIGN_ID },
    update: campaignFields,
    create: { id: CAMPAIGN_ID, ...campaignFields },
  })

  const eventFields = {
    title: 'The Barn Raising — Send-off',
    description:
      'The July 18 send-off. Come stand a plank: replace the car, back the pre-sale, fund the runway. ' +
      'Details to follow — RSVP so we can plan the room.',
    eventType: 'gathering',
    topic: campaign.topic,
    campaignContext: campaign.campaignContext,
    primaryDomain: campaign.primaryDomain,
    locationType: 'in_person',
    locationDetails: 'Portland — exact venue shared with RSVPs.',
    startTime: start,
    endTime: end,
    timezone: 'America/Los_Angeles',
    status: 'scheduled',
    visibility: 'public',
    instanceId,
    parentEventArtifactId: null,
  }
  const event = await db.eventArtifact.upsert({
    where: { id: EVENT_ID },
    update: eventFields,
    create: {
      id: EVENT_ID,
      linkedCampaignId: campaign.id,
      createdByActorId: creator.id,
      ...eventFields,
    },
  })

  for (const [i, hostId] of hostIds.entries()) {
    await db.eventParticipant.upsert({
      where: { eventId_participantId: { eventId: event.id, participantId: hostId } },
      update: { participantState: 'RSVP_yes', functionalRole: i === 0 ? 'host' : 'co_host' },
      create: {
        eventId: event.id,
        participantId: hostId,
        participantState: 'RSVP_yes',
        functionalRole: i === 0 ? 'host' : 'co_host',
      },
    })
  }

  await db.eventCampaign.update({
    where: { id: campaign.id },
    data: { linkedEventIds: JSON.stringify([event.id]) },
  })

  console.log('✅ Barn send-off seeded:', {
    instance: instance.slug,
    campaign: campaign.id,
    event: event.id,
    host: creator.name,
    when: start.toISOString(),
  })
  console.log(
    'ℹ️  Set the barn instance ACTIVE in Admin for this to surface on /event and the homepage.',
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void db.$disconnect())
