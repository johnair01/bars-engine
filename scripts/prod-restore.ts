import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

// Tables in FK-safe insertion order (parents before children)
const INSERT_ORDER = [
  'globalState',
  'appConfig',
  'role',
  'nation',
  'polarity',
  'nationMove',
  'archetype',
  'bar',
  'instance',
  'invite',
  'player',
  'account',
  'playerRole',
  'emotionalFirstAidTool',
  'emotionalFirstAidSession',
  'starterPack',
  'book',
  'bookAnalysisResumeLog',
  'customBar',
  'shadow321Session',
  'questPack',
  'packQuest',
  'packProgress',
  'playerBar',
  'barShare',
  'barResponse',
  'quest',
  'playerQuest',
  'adventure',
  'passage',
  'playerAdventureProgress',
  'questThread',
  'threadQuest',
  'threadProgress',
  'vibulon',
  'vibulonEvent',
  'vibeulonLedger',
  'twineStory',
  'compiledTweeVersion',
  'twineRun',
  'twineBinding',
  'barDeck',
  'barDeckCard',
  'barBinding',
  'actorDeckState',
  'storyTick',
  'gameboardSlot',
  'gameboardBid',
  'gameboardAidOffer',
  'bountyStake',
  'redemptionPack',
  'donation',
  'instanceMembership',
  'instanceParticipation',
  'campaignInvitation',
  'campaignPlaybook',
  'eventCampaign',
  'eventArtifact',
  'eventParticipant',
  'eventInvite',
  'auditLog',
  'adminAuditLog',
  'microTwineModule',
  'verificationCompletionLog',
  'playerNationMoveUnlock',
  'playerMoveEquip',
  'moveUse',
  'questMoveLog',
  'libraryRequest',
  'docNode',
  'docEvidenceLink',
  'backlogItem',
  'schism',
  'specKitBacklogItem',
  'aiResponseCache',
]

// Map snake_case raw SQL column names to camelCase Prisma field names
function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    result[camelKey] = value
  }
  return result
}

async function restore() {
  const snapshotFile = process.argv[2]
  if (!snapshotFile) {
    console.error('Usage: npx tsx scripts/prod-restore.ts backups/prod_snapshot_<timestamp>.json')
    process.exit(1)
  }

  if (!fs.existsSync(snapshotFile)) {
    console.error(`❌ File not found: ${snapshotFile}`)
    process.exit(1)
  }

  console.log(`📥 Restoring from: ${snapshotFile}`)
  const snapshot = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'))
  const { data, counts } = snapshot

  console.log(`   Source: ${snapshot.source} @ ${snapshot.timestamp}`)
  console.log(`   Tables: ${Object.keys(counts).length}, Records: ${Object.values(counts as Record<string, number>).reduce((a: number, b: number) => a + b, 0)}`)

  // Disable FK checks for bulk insert
  await prisma.$executeRawUnsafe('SET session_replication_role = replica;')

  let restored = 0
  let skipped = 0

  for (const table of INSERT_ORDER) {
    const rows = data[table]
    if (!rows || rows.length === 0) continue

    console.log(`   ${table} (${rows.length})...`)

    // Determine if rows are snake_case (raw SQL) or camelCase (Prisma)
    const sampleKeys = Object.keys(rows[0])
    const isSnakeCase = sampleKeys.some((k: string) => k.includes('_'))
    const normalizedRows = isSnakeCase ? rows.map(snakeToCamel) : rows

    let tableRestored = 0
    for (const row of normalizedRows) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any)[table].upsert({
          where: { id: row.id },
          update: {},
          create: row,
        })
        tableRestored++
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        if (tableRestored === 0) {
          console.log(`      ⚠️  ${msg.slice(0, 120)}`)
        }
        skipped++
      }
    }
    restored += tableRestored
  }

  // Re-enable FK checks
  await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;')

  console.log(`\n✅ Restore complete: ${restored} records restored, ${skipped} skipped`)
  await prisma.$disconnect()
}

restore().catch(e => { console.error('❌', e); process.exit(1) })
