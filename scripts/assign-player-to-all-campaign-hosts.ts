/**
 * Merge a player into EventCampaign.hostActorIds for every campaign (idempotent).
 * Use to make yourself (or the canonical admin player) a host on all existing productions.
 *
 * Usage:
 *   npx tsx scripts/with-env.ts "tsx scripts/assign-player-to-all-campaign-hosts.ts"
 *   npx tsx scripts/with-env.ts "tsx scripts/assign-player-to-all-campaign-hosts.ts" -- --email you@example.com
 *
 * Defaults: --email from CAMPAIGN_OWNER_EMAIL || admin@admin.local (first player on that account).
 */

import './require-db-env'
import { db } from '../src/lib/db'

async function main() {
  try {
    const argv = process.argv.slice(2)
    let email = process.env.CAMPAIGN_OWNER_EMAIL?.trim() || 'admin@admin.local'
    const emailIdx = argv.indexOf('--email')
    if (emailIdx >= 0 && argv[emailIdx + 1]) {
      email = argv[emailIdx + 1].trim()
    }

    const account = await db.account.findUnique({
      where: { email: email.toLowerCase() },
      include: { players: { select: { id: true, name: true }, take: 1 } },
    })
    if (!account?.players[0]) {
      console.error(`No player found for account email: ${email}`)
      process.exit(1)
    }
    const playerId = account.players[0].id
    console.log(`Using player ${playerId} (${account.players[0].name ?? 'unnamed'}) for ${email}`)

    const campaigns = await db.eventCampaign.findMany({
      select: { id: true, hostActorIds: true, campaignContext: true },
    })
    if (campaigns.length === 0) {
      console.log('No EventCampaign rows in the database — nothing to update.')
      return
    }
    let updated = 0
    let skipped = 0
    for (const c of campaigns) {
      let hosts: string[] = []
      try {
        hosts = JSON.parse(c.hostActorIds || '[]') as string[]
      } catch {
        hosts = []
      }
      if (!Array.isArray(hosts)) hosts = []
      if (hosts.includes(playerId)) {
        console.log(`  skip (already host): ${c.campaignContext} (${c.id})`)
        skipped++
        continue
      }
      hosts.push(playerId)
      await db.eventCampaign.update({
        where: { id: c.id },
        data: { hostActorIds: JSON.stringify(hosts) },
      })
      updated++
      console.log(`  + host added: ${c.campaignContext} (${c.id})`)
    }

    console.log(`\nDone. ${updated} campaign(s) updated; ${skipped} already listed this player.`)
  } finally {
    await db.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
