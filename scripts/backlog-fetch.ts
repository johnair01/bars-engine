#!/usr/bin/env npx tsx
import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })
import * as fs from 'fs'
import * as path from 'path'

const API_URL = process.env.BACKLOG_API_URL || 'http://localhost:3000/api/backlog'
const OUTPUT_PATH = path.join(process.cwd(), '.specify', 'backlog', 'items.json')
const BACKLOG_PATH = path.join(process.cwd(), '.specify', 'backlog', 'BACKLOG.md')

type Item = { id: string; priority: number; featureName: string; link: string | null; category: string; status: string; dependencies: string }

function statusToMarkdown(status: string): string {
  if (status === 'Done') return '[x] Done'
  if (status === 'In-Progress') return '[/] In-Progress'
  if (status.startsWith('Superseded by ')) return `[${status}]`
  return '[ ] Ready'
}

function formatRow(item: Item): string {
  const featureDisplay = item.link ? `[${item.featureName}](${item.link})` : item.featureName
  const statusStr = statusToMarkdown(item.status)
  const depsStr = item.dependencies || '-'
  return `| ${item.priority} | ${item.id} | ${featureDisplay} | ${item.category} | ${statusStr} | ${depsStr} |`
}

function writeBacklogMd(items: Item[]): void {
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
  const tableRows = items.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id)).map(formatRow).join('\n')
  fs.writeFileSync(BACKLOG_PATH, header + tableHeader + tableRows + '\n\n' + footer)
  console.log(`Updated BACKLOG.md with ${items.length} items.`)
}

async function main() {
  const printOnly = process.argv.includes('--print')
  const writeMd = process.argv.includes('--write-md')
  const res = await fetch(API_URL)
  if (!res.ok) {
    console.error(`Fetch failed: ${res.status} ${res.statusText}`)
    process.exit(1)
  }
  const data = await res.json()
  const items: Item[] = Array.isArray(data) ? data : data?.items ?? []
  if (printOnly) {
    console.log(JSON.stringify({ items }, null, 2))
    return
  }
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ items }, null, 2))
  console.log(`Saved ${items.length} items to ${OUTPUT_PATH}`)
  if (writeMd) {
    writeBacklogMd(items)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
