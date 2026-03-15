#!/usr/bin/env npx tsx
/**
 * Compost Backlog — move Done and Superseded items to ARCHIVE.md.
 *
 * Keeps BACKLOG.md focused on actionable work (Ready, Future, Phase X done).
 * Archived items preserved for posterity in ARCHIVE.md.
 *
 * Usage: npm run compost:backlog
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const BACKLOG_PATH = join(process.cwd(), '.specify', 'backlog', 'BACKLOG.md')
const ARCHIVE_PATH = join(process.cwd(), '.specify', 'backlog', 'ARCHIVE.md')

function isArchived(line: string): boolean {
  const cols = line.split('|').map((c) => c.trim())
  const status = cols[5] ?? ''
  return status.includes('[x] Done') || status.includes('Superseded')
}

function main() {
  if (!existsSync(BACKLOG_PATH)) {
    console.error('BACKLOG.md not found')
    process.exit(1)
  }

  const content = readFileSync(BACKLOG_PATH, 'utf-8')
  const lines = content.split('\n')

  const tableHeader = '| Priority | ID | Feature Name | Category | Status | Dependencies |'
  const tableSep = '| :--- | :--- | :--- | :--- | :--- | :--- |'

  const beforeTable: string[] = []
  const actionableRows: string[] = []
  const archivedRows: string[] = []
  let afterTable: string[] = []
  let afterTableStart = -1

  let i = 0
  for (; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('| Priority | ID |')) break
    beforeTable.push(line)
  }
  i += 2 // skip table header and sep

  for (; i < lines.length; i++) {
    const line = lines[i]
    if (!line.startsWith('|') || line.startsWith('|---')) {
      afterTableStart = i
      break
    }
    if (isArchived(line)) {
      archivedRows.push(line)
    } else {
      actionableRows.push(line)
    }
  }

  if (afterTableStart >= 0) {
    afterTable = lines.slice(afterTableStart)
  }

  // Merge with existing archive (don't overwrite)
  const existingArchiveRows: string[] = []
  if (existsSync(ARCHIVE_PATH)) {
    const archiveLines = readFileSync(ARCHIVE_PATH, 'utf-8').split('\n')
    let inTable = false
    for (const line of archiveLines) {
      if (line.startsWith('| :--- |')) inTable = true
      else if (inTable && line.startsWith('|') && !line.startsWith('|---') && !line.includes('Priority')) {
        existingArchiveRows.push(line)
      } else if (inTable && (line.trim() === '' || line.startsWith('---'))) break
    }
  }
  function getId(row: string): string {
    const cols = row.split('|').map((c) => c.trim())
    return cols[2]?.replace(/\*/g, '') ?? ''
  }
  const existingIds = new Set(existingArchiveRows.map(getId))
  const newRows = archivedRows.filter((r) => {
    const id = getId(r)
    return id && !existingIds.has(id)
  })
  const allArchivedRows = [...existingArchiveRows, ...newRows]

  const archiveContent = [
    '# Backlog Archive (Compost)',
    '',
    'Completed and superseded items, preserved for posterity. The main [BACKLOG.md](BACKLOG.md) contains only actionable work.',
    '',
    '## Archived Items',
    '',
    tableHeader,
    tableSep,
    ...allArchivedRows,
    '',
    '---',
    `*${allArchivedRows.length} items archived. Run \`npm run compost:backlog\` to re-compost after adding new Done/Superseded items.*`,
  ].join('\n')

  const introLine = beforeTable.find((l) => l.includes('central ledger')) ?? beforeTable[2]
  const introIdx = beforeTable.indexOf(introLine)
  const beforeIntro = beforeTable.slice(0, introIdx)
  const afterIntro = beforeTable.slice(introIdx + 1)

  const compostNote = [
    '',
    '**Completed and superseded items** are archived in [ARCHIVE.md](ARCHIVE.md) for posterity. The table below shows only actionable work (Ready, Future, Phase X done).',
    '',
  ].join('\n')

  const backlogContent = [
    ...beforeIntro,
    introLine.replace('all pending', 'all **pending**'),
    compostNote,
    ...afterIntro,
    tableHeader,
    tableSep,
    ...actionableRows,
    '',
    ...afterTable,
  ].join('\n')

  writeFileSync(ARCHIVE_PATH, archiveContent)
  writeFileSync(BACKLOG_PATH, backlogContent)

  console.log(`✓ Archived ${archivedRows.length} items to ARCHIVE.md`)
  console.log(`✓ BACKLOG.md now has ${actionableRows.length} actionable rows`)
}

main()
