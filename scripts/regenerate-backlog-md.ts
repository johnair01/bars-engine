#!/usr/bin/env npx tsx
import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })
import * as fs from 'fs'
import * as path from 'path'
import { db } from '../src/lib/db'

const BACKLOG_PATH = path.join(process.cwd(), '.specify', 'backlog', 'BACKLOG.md')

function statusToMarkdown(status: string): string {
  if (status === 'Done') return '[x] Done'
  if (status === 'In-Progress') return '[/] In-Progress'
  if (status.startsWith('Superseded by ')) return `[${status}]`
  return '[ ] Ready'
}

function formatRow(item: { id: string; priority: number; featureName: string; link: string | null; category: string; status: string; dependencies: string }): string {
  const priorityStr = String(item.priority)
  const featureDisplay = item.link ? `[${item.featureName}](${item.link})` : item.featureName
  const statusStr = statusToMarkdown(item.status)
  const depsStr = item.dependencies || '-'
  return `| ${priorityStr} | ${item.id} | ${featureDisplay} | ${item.category} | ${statusStr} | ${depsStr} |`
}

async function main() {
  const items = await db.specKitBacklogItem.findMany({
    orderBy: [{ priority: 'asc' }, { id: 'asc' }],
  })

  const content = fs.readFileSync(BACKLOG_PATH, 'utf-8')
  const before = content.indexOf('## Objective Stack')
  const after = content.indexOf('## Bruised Banana Campaign')
  if (before < 0 || after < 0) {
    console.error('Could not find Objective Stack section')
    process.exit(1)
  }

  const header = content.slice(0, before)
  const footer = content.slice(after)
  const tableHeader = `## Objective Stack

| Priority | ID | Feature Name | Category | Status | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- |
`
  const tableRows = items.map(formatRow).join('\n')
  const newContent = header + tableHeader + tableRows + '\n\n' + footer

  fs.writeFileSync(BACKLOG_PATH, newContent)
  console.log(`Regenerated BACKLOG.md with ${items.length} items.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
