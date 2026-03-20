/**
 * Report recent Npc321InnerWorkMerge rows (321 Phase 7 NPC teaching log).
 *
 * Usage:
 *   npm run report:npc321-merges
 *   npm run report:npc321-merges -- --limit 50
 *   # If DATABASE_URL is missing in the shell:
 *   npx tsx scripts/with-env.ts "npx tsx scripts/report-npc321-merges.ts --limit 50"
 *
 * Requires DATABASE_URL (.env.local). Read-only.
 */

import './require-db-env'
import { db } from '../src/lib/db'

function parseLimit(argv: string[]): number {
  const i = argv.indexOf('--limit')
  if (i >= 0 && argv[i + 1]) {
    const n = parseInt(argv[i + 1], 10)
    if (!Number.isNaN(n) && n > 0 && n <= 500) return n
  }
  return 20
}

async function main() {
  const limit = parseLimit(process.argv.slice(2))

  const [total, rows] = await Promise.all([
    db.npc321InnerWorkMerge.count(),
    db.npc321InnerWorkMerge.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        humanPlayer: { select: { id: true, name: true, creatorType: true } },
        npcPlayer: { select: { id: true, name: true, creatorType: true } },
        shadow321Session: {
          select: {
            id: true,
            outcome: true,
            finalShadowName: true,
            nameResolution: true,
          },
        },
      },
    }),
  ])

  console.log('═══════════════════════════════════════════════════════════')
  console.log('  Npc321InnerWorkMerge (recent)')
  console.log('═══════════════════════════════════════════════════════════\n')
  console.log(`Total rows: ${total}`)
  console.log(`Showing: ${rows.length} (limit ${limit}, newest first)\n`)

  if (rows.length === 0) {
    console.log('No merge rows yet. Complete a 321 flow with shadow321Name + matching agent players.')
    process.exit(0)
  }

  for (const r of rows) {
    const meta = r.metadataKeys as Record<string, unknown>
    console.log('—'.repeat(60))
    console.log(`id:              ${r.id}`)
    console.log(`createdAt:       ${r.createdAt.toISOString()}`)
    console.log(`human:           ${r.humanPlayer.name} (${r.humanPlayer.creatorType}) ${r.humanPlayerId}`)
    console.log(`npc:             ${r.npcPlayer.name} (${r.npcPlayer.creatorType}) ${r.npcPlayerId}`)
    console.log(`session:         ${r.shadow321SessionId} outcome=${r.shadow321Session.outcome}`)
    console.log(`session.final:   ${r.shadow321Session.finalShadowName ?? '—'}`)
    console.log(`merge.finalName: ${r.finalShadowName}`)
    console.log(`nameResolution:  ${r.nameResolution}`)
    console.log(`suggestionCount: ${r.suggestionCount ?? '—'}`)
    const ex = r.chargeExcerpt ? String(r.chargeExcerpt) : ''
    console.log(
      `chargeExcerpt:   ${ex ? (ex.length > 100 ? `${ex.slice(0, 100)}…` : ex) : '—'}`
    )
    console.log(`metadataKeys:    ${JSON.stringify(meta)}`)
  }

  console.log('\nDone.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
