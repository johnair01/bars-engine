/**
 * Verify the latest snapshot is fresh (< 25 hours old).
 * Fails loudly if stale. Use in cron or pre-deploy checks.
 *
 * Usage: npm run snapshot:verify
 *
 * @see .specify/specs/db-data-safety/spec.md
 */

import fs from 'fs'
import path from 'path'

const MAX_AGE_HOURS = 25
const backupDir = path.join(process.cwd(), 'backups')
const logPath = path.join(backupDir, 'SNAPSHOT_LOG.md')

function main(): number {
  if (!fs.existsSync(logPath)) {
    console.error('❌ No SNAPSHOT_LOG.md found. Run npm run prod:snapshot first.')
    return 1
  }

  const content = fs.readFileSync(logPath, 'utf-8')
  const match = content.match(/^## (\d{4}-\d{2}-\d{2}T[\d:.+-]+)/m)
  if (!match) {
    console.error('❌ Could not parse latest snapshot timestamp from SNAPSHOT_LOG.md')
    return 1
  }

  const timestamp = new Date(match[1])
  const now = new Date()
  const ageHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60)

  if (ageHours > MAX_AGE_HOURS) {
    console.error('')
    console.error('❌ SNAPSHOT STALE')
    console.error(`   Latest snapshot: ${timestamp.toISOString()}`)
    console.error(`   Age: ${ageHours.toFixed(1)} hours (max ${MAX_AGE_HOURS}h)`)
    console.error('   Run: npm run prod:snapshot')
    console.error('')
    return 1
  }

  console.log(`✅ Snapshot fresh (${ageHours.toFixed(1)}h old, max ${MAX_AGE_HOURS}h)`)
  return 0
}

process.exit(main())
