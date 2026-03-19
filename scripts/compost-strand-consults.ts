#!/usr/bin/env npx tsx
/**
 * Compost Strand Consults — move consult files from Done specs to archive.
 *
 * When a spec's backlog item is Done (or Superseded), its STRAND_CONSULT.md,
 * GM_CONSULT.md, etc. are moved to .specify/archive/strand-consults/<spec-name>/.
 * Original is replaced with a stub pointing to the archive.
 *
 * Usage: npm run compost:strand-consults
 *
 * See: .specify/specs/strand-consult-composting/plan.md
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'

const SPECS_DIR = join(process.cwd(), '.specify', 'specs')
const BACKLOG_PATH = join(process.cwd(), '.specify', 'backlog', 'BACKLOG.md')
const ARCHIVE_PATH = join(process.cwd(), '.specify', 'backlog', 'ARCHIVE.md')
const CONSULT_ARCHIVE_DIR = join(process.cwd(), '.specify', 'archive', 'strand-consults')

const CONSULT_PATTERN = /CONSULT/i

function isDoneOrSuperseded(line: string): boolean {
  const cols = line.split('|').map((c) => c.trim())
  const status = cols[5] ?? ''
  return status.includes('[x] Done') || status.includes('Superseded')
}

function extractSpecPath(line: string): string | null {
  const match = line.match(/\(\.specify\/specs\/([^/]+)\/[^)]+\)/)
  return match ? match[1] : null
}

function getDoneSpecNames(): Set<string> {
  const names = new Set<string>()
  for (const file of [BACKLOG_PATH, ARCHIVE_PATH]) {
    if (!existsSync(file)) continue
    const content = readFileSync(file, 'utf-8')
    for (const line of content.split('\n')) {
      if (!line.startsWith('|') || line.startsWith('|---') || line.includes('Priority')) continue
      if (isDoneOrSuperseded(line)) {
        const spec = extractSpecPath(line)
        if (spec) names.add(spec)
      }
    }
  }
  return names
}

function isStub(content: string): boolean {
  return content.includes('Archived to') && content.includes('strand-consults')
}

function main() {
  if (!existsSync(BACKLOG_PATH)) {
    console.error('BACKLOG.md not found')
    process.exit(1)
  }

  const doneSpecs = getDoneSpecNames()
  let composted = 0
  const specsTouched = new Set<string>()

  for (const specName of doneSpecs) {
    const specDir = join(SPECS_DIR, specName)
    if (!existsSync(specDir)) continue

    const files = readdirSync(specDir)
    for (const f of files) {
      if (!f.endsWith('.md') || !CONSULT_PATTERN.test(f)) continue

      const srcPath = join(specDir, f)
      const content = readFileSync(srcPath, 'utf-8')
      if (isStub(content)) continue

      const archiveSpecDir = join(CONSULT_ARCHIVE_DIR, specName)
      mkdirSync(archiveSpecDir, { recursive: true })
      const destPath = join(archiveSpecDir, f)
      writeFileSync(destPath, content, 'utf-8')

      const stub = `# Consult Archived

This consult was composted on ${new Date().toISOString().slice(0, 10)}.

**Archived to**: [.specify/archive/strand-consults/${specName}/${f}](../../archive/strand-consults/${specName}/${f})

Run the relevant \`npm run strand:consult:*\` to refresh.
`
      writeFileSync(srcPath, stub, 'utf-8')

      composted++
      specsTouched.add(specName)
    }
  }

  if (composted > 0) {
    console.log(`✓ Composted ${composted} consult(s) from ${specsTouched.size} spec(s) to .specify/archive/strand-consults/`)
  } else {
    console.log('No consult files to compost (all Done specs either have no consults or already stubbed)')
  }
}

main()
