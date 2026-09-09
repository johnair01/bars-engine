/**
 * Ensures the six Game Master faces stay lockstep between the canonical app
 * source and the standalone `@bars-engine/core` package, which vendors its own
 * copy (the app never imports it — same convention as the transformation-move
 * registry; see verify-transformation-registry-lockstep.ts).
 *
 * Compares the three canonical declarations — `GameMasterFace`,
 * `GAME_MASTER_FACES`, and `FACE_META` — which sit consecutively in both files.
 * The rest of each `types.ts` differs, so the whole file is not compared; only
 * this block is.
 *
 * Run: npx tsx scripts/verify-face-meta-lockstep.ts
 * Wired: npm run verify:face-meta-lockstep → verify:build-reliability
 */

import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const APP = 'src/lib/quest-grammar/types.ts'
const PKG = 'packages/bars-core/src/quest-grammar/types.ts'

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

function sha(s: string): string {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex')
}

/**
 * Extract the `GameMasterFace` → `FACE_META` block: from the `GameMasterFace`
 * type declaration through the closing brace of the `FACE_META` object literal
 * (a `}` at column 0). Returns null if the shape is not found, which is itself
 * a lockstep failure worth surfacing.
 */
function extractFaceBlock(source: string, rel: string): string {
  const start = source.indexOf('export type GameMasterFace')
  const metaStart = source.indexOf('export const FACE_META', start)
  if (start === -1 || metaStart === -1) {
    throw new Error(`Could not locate the GameMasterFace/FACE_META block in ${rel}`)
  }
  const metaEnd = source.indexOf('\n}', metaStart)
  if (metaEnd === -1) {
    throw new Error(`Could not find the end of FACE_META in ${rel}`)
  }
  return source.slice(start, metaEnd + 2)
}

const appBlock = extractFaceBlock(read(APP), APP)
const pkgBlock = extractFaceBlock(read(PKG), PKG)

if (sha(appBlock) !== sha(pkgBlock)) {
  console.error(
    '✗ Face metadata lockstep: GameMasterFace / GAME_MASTER_FACES / FACE_META differ.\n' +
      `  App (canonical): ${APP}\n` +
      `  Core (mirror):   ${PKG}\n` +
      '  Sync the block in the bars-core copy to match the app source.',
  )
  process.exit(1)
}

console.log('✓ Face metadata lockstep (app ↔ bars-core)')
