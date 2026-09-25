import './require-db-env'
import { db } from '../src/lib/db'
import { WORKSTREAMS, subcampaignSlug } from '../src/lib/ally-campaign/workstreams'
import { INPUTS, campaignTotals } from '../src/lib/ally-campaign/economics'

/**
 * Seed the Ally Campaign: the Mobility Quest parent plus one SUB-CAMPAIGN per
 * workstream, each with its milestone and its superpower-typed needs.
 *
 * Structure this creates:
 *
 *   Instance  mobility-quest
 *     └─ Campaign  mobility-quest                    (parent, GATHERING_RESOURCES)
 *          ├─ Campaign  mobility-quest-car           (GATHERING_RESOURCES)
 *          ├─ Campaign  mobility-quest-print-run     (GATHERING_RESOURCES)
 *          ├─ Campaign  mobility-quest-dream-100     (RAISE_AWARENESS)
 *          ├─ Campaign  mobility-quest-nonprofit     (SKILLFUL_ORGANIZING)
 *          └─ Campaign  mobility-quest-book-tour     (DIRECT_ACTION)
 *
 * Sub-campaigns nest via `Campaign.parentCampaignId` and must stay inside the
 * same `instanceId` (schema comment on that field) — so every child is created
 * against the parent's instance, and further nesting is available for free when
 * a friend eventually wants their own branch under a workstream.
 *
 * IDEMPOTENT. Deterministic ids are upserted; re-running preserves milestone
 * `currentValue` and each need's `status` / claimant, so a re-seed after a copy
 * edit never wipes real commitments.
 *
 * Apply the migration first:  npm run db:migrate:deploy
 * Then run:                   npx tsx scripts/seed-ally-campaign.ts
 */
const PARENT_REF = 'mobility-quest'

/**
 * Resolve who OWNS this campaign. This is not cosmetic: `assertCampaignSteward`
 * grants board access to the campaign's `createdById`, so whoever this returns is
 * who can see /campaign/mobility-quest/allies and download the CSV.
 *
 * Order: explicit env → a global admin → first player (with a loud warning).
 * The old `findFirst()`-only behaviour silently handed ownership to whichever row
 * the database returned first, which is arbitrary and very confusing to debug
 * from the far side of a 403.
 */
async function resolveOwner() {
  const email = process.env.ALLY_CAMPAIGN_OWNER_EMAIL?.trim()

  if (email) {
    const byEmail = await db.player.findFirst({ where: { contactValue: email } })
    if (!byEmail) {
      throw new Error(
        `ALLY_CAMPAIGN_OWNER_EMAIL="${email}" matched no player. Check the address, or unset it to fall back to a global admin.`,
      )
    }
    console.log(`   owner: ${byEmail.name} <${byEmail.contactValue}> (from ALLY_CAMPAIGN_OWNER_EMAIL)`)
    return byEmail
  }

  const adminRole = await db.playerRole.findFirst({
    where: { role: { key: 'admin' } },
    include: { player: true },
  })
  if (adminRole?.player) {
    console.log(`   owner: ${adminRole.player.name} <${adminRole.player.contactValue}> (global admin)`)
    return adminRole.player
  }

  const first = await db.player.findFirst()
  if (!first) throw new Error('No player found for createdById — seed players first.')
  console.warn(
    `   ⚠️  owner: ${first.name} <${first.contactValue}> — arbitrary first player.\n` +
      '      No admin role found and ALLY_CAMPAIGN_OWNER_EMAIL is unset. This player, and\n' +
      '      only this player, will be able to open the ally board. Re-run with\n' +
      '      ALLY_CAMPAIGN_OWNER_EMAIL=you@example.com to set it deliberately.',
  )
  return first
}

async function seed() {
  console.log('--- Seeding Ally Campaign (parent + 5 workstream sub-campaigns) ---')

  const creator = await resolveOwner()

  const totals = campaignTotals()
  const blurb =
    'Getting Mastering the Game of Allyship to the people it is for — a vehicle, a print run, a hundred real relationships, an entity that outlives its founder, and twelve rooms with dates on them.'

  // ── Parent instance + campaign ────────────────────────────────────────────
  const instance = await db.instance.upsert({
    where: { slug: PARENT_REF },
    update: {
      name: 'Mobility Quest',
      campaignRef: PARENT_REF,
      targetDescription: blurb,
      goalAmountCents: totals.capitalNeededCents,
      allyshipDomain: 'GATHERING_RESOURCES',
    },
    create: {
      slug: PARENT_REF,
      name: 'Mobility Quest',
      domainType: 'gathering_resources',
      campaignRef: PARENT_REF,
      targetDescription: blurb,
      goalAmountCents: totals.capitalNeededCents,
      allyshipDomain: 'GATHERING_RESOURCES',
    },
  })

  const parent = await db.campaign.upsert({
    where: { slug: PARENT_REF },
    update: {
      name: 'Mobility Quest',
      status: 'LIVE',
      allyshipDomain: 'GATHERING_RESOURCES',
      description: blurb,
      instanceId: instance.id,
    },
    create: {
      slug: PARENT_REF,
      name: 'Mobility Quest',
      status: 'LIVE',
      allyshipDomain: 'GATHERING_RESOURCES',
      description: blurb,
      instanceId: instance.id,
      createdById: creator.id,
    },
  })
  console.log(`✅ parent campaign ${parent.slug} (instance ${instance.id})`)
  console.log(`   goal: ${(totals.capitalNeededCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`)

  // ── One sub-campaign per workstream ───────────────────────────────────────
  for (const w of WORKSTREAMS) {
    const slug = subcampaignSlug(w.key)

    const child = await db.campaign.upsert({
      where: { slug },
      update: {
        name: w.title,
        status: 'LIVE',
        allyshipDomain: w.domain,
        description: w.emergentProblem,
        instanceId: instance.id,
        parentCampaignId: parent.id,
      },
      create: {
        slug,
        name: w.title,
        status: 'LIVE',
        allyshipDomain: w.domain,
        description: w.emergentProblem,
        instanceId: instance.id,
        parentCampaignId: parent.id,
        createdById: creator.id,
      },
    })
    console.log(`\n✅ sub-campaign ${child.slug}  [${w.domain}]`)

    const milestoneId = `aq-ms-${w.key}`
    await db.campaignMilestone.upsert({
      where: { id: milestoneId },
      // Preserve currentValue on re-seed; only (re)set structural fields.
      update: {
        campaignRef: slug,
        title: w.milestone.title,
        description: w.theAsk,
        targetValue: w.milestone.targetValue,
        status: 'active',
      },
      create: {
        id: milestoneId,
        campaignRef: slug,
        title: w.milestone.title,
        description: w.theAsk,
        targetValue: w.milestone.targetValue,
        status: 'active',
        proposedByPlayerId: creator.id,
      },
    })
    console.log(`   milestone ${milestoneId}: ${w.milestone.title} (target ${w.milestone.targetValue} ${w.milestone.unit})`)

    for (const n of w.needs) {
      await db.milestoneNeed.upsert({
        where: { id: n.id },
        // Preserve status + claimant on re-seed — a real commitment is never
        // clobbered by a copy edit.
        update: {
          milestoneId,
          campaignRef: slug,
          superpower: n.superpower,
          orientation: n.orientation,
          cardId: n.cardId,
          unit: n.unit,
          value: n.value,
          bountyVibeulons: n.bountyVibeulons,
          title: n.title,
        },
        create: {
          id: n.id,
          milestoneId,
          campaignRef: slug,
          superpower: n.superpower,
          orientation: n.orientation,
          cardId: n.cardId,
          unit: n.unit,
          value: n.value,
          bountyVibeulons: n.bountyVibeulons,
          title: n.title,
          status: 'open',
        },
      })
      console.log(
        `   • ${n.id.padEnd(26)} ${n.superpower}/${n.orientation}  ${n.value} ${n.unit}  ${n.bountyVibeulons} vib`,
      )
    }
  }

  const needCount = WORKSTREAMS.reduce((s, w) => s + w.needs.length, 0)
  console.log(
    `\n✅ Ally Campaign seeded: 1 parent, ${WORKSTREAMS.length} sub-campaigns, ${WORKSTREAMS.length} milestones, ${needCount} needs.`,
  )
  console.log(`   Print run: ${INPUTS.printRunUnits} copies (${INPUTS.unitsHeldForEvents} held for events)`)
  console.log(`   Board:     /campaign/${PARENT_REF}/allies`)
  console.log(`   Warm CYOA: /ally/mom`)
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
