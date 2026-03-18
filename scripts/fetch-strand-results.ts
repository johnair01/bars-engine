#!/usr/bin/env npx tsx
/**
 * Fetch and display strand results (Shaman, Sage, Architect output).
 * Usage: npx tsx scripts/fetch-strand-results.ts <strand_bar_id>
 */

import './require-db-env'
import { db } from '../src/lib/db'

const strandBarId = process.argv[2]
if (!strandBarId) {
  console.error('Usage: npx tsx scripts/fetch-strand-results.ts <strand_bar_id>')
  process.exit(1)
}

async function main() {
  const strandBar = await db.customBar.findUnique({
    where: { id: strandBarId },
    select: { title: true, description: true, strandMetadata: true },
  })
  if (!strandBar) {
    console.error('Strand BAR not found:', strandBarId)
    process.exit(1)
  }

  console.log('════════════════════════════════════════════════════════════')
  console.log('  STRAND:', strandBar.title)
  console.log('════════════════════════════════════════════════════════════\n')

  const meta = strandBar.strandMetadata ? JSON.parse(strandBar.strandMetadata) : {}
  const log = meta.audit_trail || meta.decision_audit_log || []

  for (const entry of log) {
    if (entry.event !== 'run') continue
    const data = entry.data || {}
    if (entry.sect === 'shaman' && (data.output_preview ?? entry.output_preview)) {
      console.log('## Shaman (emotional/root-cause)\n')
      console.log(data.output_preview ?? entry.output_preview)
      console.log('\n...\n')
    } else if (entry.sect === 'sage' && (data.synthesis_preview ?? entry.synthesis_preview)) {
      console.log('## Sage (synthesis)\n')
      console.log(data.synthesis_preview ?? entry.synthesis_preview)
      console.log('\n...\n')
    } else if (entry.sect === 'architect' && (data.output_bar_id ?? entry.output_bar_id)) {
      const barId = data.output_bar_id ?? entry.output_bar_id
      const outBar = await db.customBar.findUnique({
        where: { id: barId },
        select: { title: true, description: true },
      })
      if (outBar) {
        console.log('## Architect (diagnostic spec)\n')
        console.log('Title:', outBar.title)
        console.log('\nDescription:\n', outBar.description || '(none)')
      }
    }
  }

  const outputIds = meta.output_thread_links?.map((l: { bar_id: string }) => l.bar_id) || []
  if (outputIds.length > 0) {
    console.log('\n────────────────────────────────────────────────────────────')
    console.log('Output BAR IDs:', outputIds.join(', '))
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
