/**
 * April 4 dance party + nested pre-production EventArtifacts for BB-BDAY-001.
 * Hosts: Wendell + JJ (by player name, case-insensitive).
 *
 * Run: npx tsx scripts/seed-april4-dance-party.ts
 */
import './require-db-env'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const INSTANCE_ID = 'BB-BDAY-001'
const CAMPAIGN_ID = 'EC-BB-APRIL-DANCE-2026'
const MAIN_EVENT_ID = 'EVT-BB-DANCE-2026-04-04'

const PRE = {
  ops: 'EVT-BB-DANCE-2026-PRE-OPS',
  music: 'EVT-BB-DANCE-2026-PRE-MUSIC',
  decor: 'EVT-BB-DANCE-2026-PRE-DECOR',
} as const

async function main() {
  const instance = await db.instance.findUnique({ where: { id: INSTANCE_ID } })
  if (!instance) {
    console.error(`Instance ${INSTANCE_ID} not found. Run party seed or create instance first.`)
    process.exit(1)
  }

  const wendell = await db.player.findFirst({
    where: { name: { equals: 'Wendell', mode: 'insensitive' } },
  })
  const jj =
    (await db.player.findFirst({
      where: { name: { equals: 'JJ', mode: 'insensitive' } },
    })) ??
    (await db.player.findFirst({
      where: { name: { contains: 'JJ', mode: 'insensitive' } },
    }))
  const admin = await db.player.findFirst({
    where: { roles: { some: { role: { key: 'admin' } } } },
  })
  const creator = wendell ?? jj ?? admin ?? (await db.player.findFirst())
  if (!creator) {
    console.error('No players in DB.')
    process.exit(1)
  }

  const hostIds: string[] = []
  if (wendell) hostIds.push(wendell.id)
  if (jj && !hostIds.includes(jj.id)) hostIds.push(jj.id)
  if (hostIds.length === 0) {
    console.warn('Wendell/JJ not found by name — hostActorIds will be []. Add hosts in Admin or rename players to match.')
  }

  // April 4 (local PT) — adjust in DB if needed
  const partyStart = new Date('2026-04-04T22:00:00-07:00')
  const partyEnd = new Date('2026-04-05T03:00:00-07:00')

  const campaign = await db.eventCampaign.upsert({
    where: { id: CAMPAIGN_ID },
    update: {
      campaignContext: 'Bruised Banana Birthday — April dance',
      topic: 'Community dance & residency celebration',
      primaryDomain: 'GATHERING_RESOURCES',
      productionGrammar: 'kotter',
      status: 'planning',
      instanceId: INSTANCE_ID,
      hostActorIds: JSON.stringify(hostIds),
    },
    create: {
      id: CAMPAIGN_ID,
      campaignContext: 'Bruised Banana Birthday — April dance',
      topic: 'Community dance & residency celebration',
      primaryDomain: 'GATHERING_RESOURCES',
      productionGrammar: 'kotter',
      status: 'planning',
      instanceId: INSTANCE_ID,
      hostActorIds: JSON.stringify(hostIds),
    },
  })

  const venueBlurb = `Venue confirmed for April 4 — details shared with hosts and pre-production crew only.`

  const mainEvent = await db.eventArtifact.upsert({
    where: { id: MAIN_EVENT_ID },
    update: {
      title: 'Bruised Banana Birthday Dance',
      description: `In-person dance party. ${venueBlurb}`,
      eventType: 'dance',
      topic: campaign.topic,
      campaignContext: campaign.campaignContext,
      primaryDomain: campaign.primaryDomain,
      locationType: 'in_person',
      locationDetails: venueBlurb,
      startTime: partyStart,
      endTime: partyEnd,
      timezone: 'America/Los_Angeles',
      status: 'scheduled',
      visibility: 'campaign_visible',
      instanceId: INSTANCE_ID,
      parentEventArtifactId: null,
    },
    create: {
      id: MAIN_EVENT_ID,
      linkedCampaignId: campaign.id,
      createdByActorId: creator.id,
      title: 'Bruised Banana Birthday Dance',
      description: `In-person dance party. ${venueBlurb}`,
      eventType: 'dance',
      topic: campaign.topic,
      campaignContext: campaign.campaignContext,
      primaryDomain: campaign.primaryDomain,
      locationType: 'in_person',
      locationDetails: venueBlurb,
      startTime: partyStart,
      endTime: partyEnd,
      timezone: 'America/Los_Angeles',
      status: 'scheduled',
      visibility: 'campaign_visible',
      instanceId: INSTANCE_ID,
    },
  })

  const preSpecs = [
    { id: PRE.ops, title: 'Ops, door & flow', desc: 'Setup, breakdown, door shifts, crowd flow.' },
    { id: PRE.music, title: 'Music & sound', desc: 'DJ / playlists / soundcheck.' },
    { id: PRE.decor, title: 'Decor & vibe', desc: 'Room transformation, lighting, mood.' },
  ] as const

  for (const p of preSpecs) {
    await db.eventArtifact.upsert({
      where: { id: p.id },
      update: {
        title: p.title,
        description: p.desc,
        eventType: 'gathering',
        topic: campaign.topic,
        campaignContext: campaign.campaignContext,
        primaryDomain: campaign.primaryDomain,
        secondaryDomain: 'pre_production',
        locationType: 'in_person',
        locationDetails: venueBlurb,
        status: 'scheduled',
        visibility: 'campaign_visible',
        instanceId: INSTANCE_ID,
        parentEventArtifactId: mainEvent.id,
      },
      create: {
        id: p.id,
        linkedCampaignId: campaign.id,
        createdByActorId: creator.id,
        title: p.title,
        description: p.desc,
        eventType: 'gathering',
        topic: campaign.topic,
        campaignContext: campaign.campaignContext,
        primaryDomain: campaign.primaryDomain,
        secondaryDomain: 'pre_production',
        locationType: 'in_person',
        locationDetails: venueBlurb,
        status: 'scheduled',
        visibility: 'campaign_visible',
        instanceId: INSTANCE_ID,
        parentEventArtifactId: mainEvent.id,
      },
    })
  }

  for (const [i, hostId] of hostIds.entries()) {
    await db.eventParticipant.upsert({
      where: {
        eventId_participantId: { eventId: mainEvent.id, participantId: hostId },
      },
      update: {
        participantState: 'RSVP_yes',
        functionalRole: i === 0 ? 'host' : 'co_host',
      },
      create: {
        eventId: mainEvent.id,
        participantId: hostId,
        participantState: 'RSVP_yes',
        functionalRole: i === 0 ? 'host' : 'co_host',
      },
    })
  }

  await db.eventCampaign.update({
    where: { id: campaign.id },
    data: { linkedEventIds: JSON.stringify([mainEvent.id, ...Object.values(PRE)]) },
  })

  console.log('✅ April 4 dance campaign + nested pre-production artifacts:', {
    campaign: campaign.id,
    main: mainEvent.id,
    pre: Object.values(PRE),
    hosts: hostIds.length,
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
