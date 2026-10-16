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
import { COLLECTIONS, RECORD_KINDS, validateSave } from '../src/lib/board/save'

const args = process.argv.slice(2)
const dir = args.find(a => !a.startsWith('--'))
const board = args.includes('--board') ? args[args.indexOf('--board') + 1] : 'nonprofit'
const dry = args.includes('--dry')
if (!dir) { console.error('usage: board-import-artifact-store.ts <dir> [--board nonprofit] [--dry]'); process.exit(2) }

async function main() {
  const db = new PrismaClient()
  let added = 0, same = 0, refused = 0
  for (const collection of COLLECTIONS) {
    const folder = path.join(dir!, collection)
    if (!fs.existsSync(folder)) continue
    for (const f of fs.readdirSync(folder).filter(n => n.endsWith('.json')).sort()) {
      const docId = f.slice(0, -5)
      const data = JSON.parse(fs.readFileSync(path.join(folder, f), 'utf8'))
      const v = validateSave({ board, collection, docId, data })
      if (!v.ok) { refused++; console.warn(`refused ${collection}/${docId}: ${v.errors.join('; ')}`); continue }
      const latest = await db.boardSave.findFirst({ where: { board, collection, docId }, orderBy: { receivedAt: 'desc' } })
      if (latest && JSON.stringify(latest.data) === JSON.stringify(data)) { same++; continue }
      console.log(`${dry ? 'would add' : 'add'} ${collection}/${docId}`)
      if (!dry) await db.boardSave.create({ data: {
        board, collection, docId, data, source: 'artifact-import',
        recordedAt: RECORD_KINDS.has(collection) ? null : new Date(),
        record: RECORD_KINDS.has(collection) ? null : 'board state; not recorded on main',
      } })
      added++
    }
  }
  console.log(`${added} ${dry ? 'to add' : 'added'}, ${same} already here, ${refused} refused`)
  await db.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
