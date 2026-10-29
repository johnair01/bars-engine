/**
 * Import a saved claude.ai artifact store (the folder the Artifact tool's read_db out_dir writes:
 * <dir>/<collection>/<docId>.json) into board_saves, so nothing saved on the old board is lost in the move.
 *
 *   npx tsx scripts/board-import-artifact-store.ts <dir> [--board nonprofit] [--dry]
 *
 * Every document lands unrecorded (for record kinds), with source 'artifact-import'. The board-pull Action then runs
 * board/pull.py over it; pull.py records only what main lacks and acknowledges the rest, so importing documents
 * main already holds is harmless. Documents identical to the latest row already here are skipped, so a rerun adds
 * nothing.
 */
import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { COLLECTIONS } from '../src/lib/board/save'
import { importDocs, type ImportDoc } from '../src/lib/board/import'

const args = process.argv.slice(2)
const dir = args.find(a => !a.startsWith('--'))
const board = args.includes('--board') ? args[args.indexOf('--board') + 1] : 'nonprofit'
const dry = args.includes('--dry')
if (!dir) { console.error('usage: board-import-artifact-store.ts <dir> [--board nonprofit] [--dry]'); process.exit(2) }

async function main() {
  const db = new PrismaClient()
  const docs: ImportDoc[] = []
  for (const collection of COLLECTIONS) {
    const folder = path.join(dir!, collection)
    if (!fs.existsSync(folder)) continue
    for (const f of fs.readdirSync(folder).filter(n => n.endsWith('.json')).sort())
      docs.push({ collection, docId: f.slice(0, -5), data: JSON.parse(fs.readFileSync(path.join(folder, f), 'utf8')) })
  }
  const r = await importDocs(db, board, docs, dry)
  r.refused.forEach(x => console.warn(`refused ${x}`))
  r.added.forEach(x => console.log(`${dry ? 'would add' : 'add'} ${x}`))
  console.log(`${r.added.length} ${dry ? 'to add' : 'added'}, ${r.same} already here, ${r.refused.length} refused`)
  await db.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
