#!/usr/bin/env npx tsx
/**
 * EIP T7 — verify DB state after `npm run seed:event-invite-bar`.
 *
 *   npm run verify:event-invite-seed
 *
 * Checks: event_invite BARs, story JSON, Partiful URLs, initiation Adventures + start passage.
 *
 * **Strict Partiful:** set `EIP_VERIFY_STRICT=1` to fail when Partiful URLs are still the
 * placeholder (`https://partiful.com/`) — use before production deploy once real URLs are required.
 */
import './require-db-env'
import { db } from '../src/lib/db'
import { EVENT_INVITE_BAR_TYPE, parseEventInviteStory } from '../src/lib/event-invite-story/schema'
import { eventInitiationAdventureSlug } from '../src/lib/event-invite-party'

const PLACEHOLDER_PARTIFUL = 'https://partiful.com/'

const BARS: Array<{
  id: string
  expectedEventSlug: string
  label: string
  partifulEnvVar: string
}> = [
  {
    id: 'bb-event-invite-apr4-dance',
    expectedEventSlug: 'apr-4-dance',
    label: 'April 4 dance',
    partifulEnvVar: 'EIP_PARTIFUL_APR4_URL',
  },
  {
    id: 'bb-event-invite-apr26',
    expectedEventSlug: 'apr-5-game',
    label: 'April 5 The Game',
    partifulEnvVar: 'EIP_PARTIFUL_APR5_URL',
  },
]

const INITIATIONS: Array<{ eventSlug: 'apr-4-dance' | 'apr-5-game'; label: string }> = [
  { eventSlug: 'apr-4-dance', label: 'Apr 4 initiation' },
  { eventSlug: 'apr-5-game', label: 'Apr 5 initiation' },
]

const campaignRef = 'bruised-banana'

function isHttpsUrl(s: string | null | undefined): boolean {
  if (!s?.trim()) return false
  try {
    const u = new URL(s.trim())
    return u.protocol === 'https:'
  } catch {
    return false
  }
}

async function main() {
  const strict = process.env.EIP_VERIFY_STRICT === '1' || process.env.EIP_VERIFY_STRICT === 'true'
  let errors = 0
  let warnings = 0

  for (const row of BARS) {
    const bar = await db.customBar.findUnique({
      where: { id: row.id },
      select: {
        id: true,
        type: true,
        visibility: true,
        status: true,
        archivedAt: true,
        storyContent: true,
        partifulUrl: true,
        eventSlug: true,
        campaignRef: true,
      },
    })

    if (!bar) {
      console.error(`❌ Missing CustomBar ${row.id} (${row.label}). Run: npm run seed:event-invite-bar`)
      errors++
      continue
    }

    if (bar.type !== EVENT_INVITE_BAR_TYPE) {
      console.error(`❌ ${row.id}: expected type ${EVENT_INVITE_BAR_TYPE}, got ${bar.type}`)
      errors++
    }
    if (bar.visibility !== 'public') {
      console.error(`❌ ${row.id}: expected visibility public, got ${bar.visibility}`)
      errors++
    }
    if (bar.status !== 'active') {
      console.error(`❌ ${row.id}: expected status active, got ${bar.status}`)
      errors++
    }
    if (bar.archivedAt) {
      console.error(`❌ ${row.id}: archivedAt is set`)
      errors++
    }
    if (bar.campaignRef !== campaignRef) {
      console.error(`❌ ${row.id}: expected campaignRef ${campaignRef}, got ${bar.campaignRef}`)
      errors++
    }
    if (bar.eventSlug?.trim() !== row.expectedEventSlug) {
      console.error(
        `❌ ${row.id}: expected eventSlug "${row.expectedEventSlug}", got "${bar.eventSlug ?? ''}"`
      )
      errors++
    }

    const story = parseEventInviteStory(bar.storyContent)
    if (!story) {
      console.error(`❌ ${row.id}: storyContent does not parse as EventInviteStory`)
      errors++
    }

    if (!isHttpsUrl(bar.partifulUrl)) {
      console.error(`❌ ${row.id}: partifulUrl must be a valid HTTPS URL`)
      errors++
    } else if (bar.partifulUrl?.trim() === PLACEHOLDER_PARTIFUL) {
      const msg = `${row.id}: partifulUrl is still placeholder — set ${row.partifulEnvVar} and re-seed, or Hand → Vault`
      if (strict) {
        console.error(`❌ ${msg}`)
        errors++
      } else {
        console.warn(`⚠️  ${msg}`)
        warnings++
      }
    }
  }

  for (const row of INITIATIONS) {
    const slug = eventInitiationAdventureSlug(campaignRef, row.eventSlug, 'player')
    const adv = await db.adventure.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        status: true,
        startNodeId: true,
      },
    })

    if (!adv) {
      console.error(`❌ Missing Adventure "${slug}" (${row.label}). Run: npm run seed:event-invite-bar`)
      errors++
      continue
    }

    if (adv.status !== 'ACTIVE') {
      console.error(`❌ ${slug}: expected status ACTIVE, got ${adv.status}`)
      errors++
    }
    if (!adv.startNodeId?.trim()) {
      console.error(`❌ ${slug}: missing startNodeId`)
      errors++
      continue
    }

    const startPassage = await db.passage.findUnique({
      where: {
        adventureId_nodeId: { adventureId: adv.id, nodeId: adv.startNodeId },
      },
      select: { id: true },
    })
    if (!startPassage) {
      console.error(`❌ ${slug}: no passage for startNodeId "${adv.startNodeId}"`)
      errors++
    }
  }

  if (warnings > 0 && !strict) {
    console.warn('')
    console.warn(`⚠️  ${warnings} warning(s) (not fatal). Run with EIP_VERIFY_STRICT=1 before prod to require real Partiful URLs.`)
  }

  if (errors > 0) {
    console.error('')
    console.error(`❌ verify-event-invite-seed: ${errors} error(s)`)
    process.exit(1)
  }

  console.log('✅ verify-event-invite-seed: BARs + initiation Adventures OK')
  console.log('   Manual: incognito — /invite/event/bb-event-invite-apr4-dance → Partiful + Begin initiation')
  console.log('           — /invite/event/bb-event-invite-apr26 → same for April 5')
  process.exit(0)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
