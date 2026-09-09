/**
 * Ensures the six Game Master faces stay lockstep between the canonical app
 * source and the standalone `@bars-engine/core` package, which vendors its own
 * copy (the app never imports it — same convention as the transformation-move
 * registry; see verify-transformation-registry-lockstep.ts).
 *
 * Two checks:
 *   1. FACE_META block (quest-grammar/types.ts) — `GameMasterFace`,
 *      `GAME_MASTER_FACES`, and `FACE_META` sit consecutively and are compared
 *      byte-for-byte. The rest of each `types.ts` differs, so only this block
 *      is compared.
 *   2. FACE_TRIGRAM map (quest-grammar/iching-faces.ts) — compared by parsed
 *      face→trigram VALUES, not byte-for-byte: the app copy is `export`ed with a
 *      doc comment while the package copy is a bare `const`, so only the object
 *      entries are the shared contract.
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

const TYPES_APP = 'src/lib/quest-grammar/types.ts'
const TYPES_PKG = 'packages/bars-core/src/quest-grammar/types.ts'
const ICHING_APP = 'src/lib/quest-grammar/iching-faces.ts'
const ICHING_PKG = 'packages/bars-core/src/quest-grammar/iching-faces.ts'

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

function sha(s: string): string {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex')
}

/**
 * Extract the `GameMasterFace` → `FACE_META` block: from the `GameMasterFace`
 * type declaration through the closing brace of the `FACE_META` object literal
 * (a `}` at column 0).
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

/**
 * Extract the FACE_TRIGRAM face→trigram entries as a normalized, order-
 * independent string (e.g. "architect=Heaven;challenger=Fire;..."). Comment and
 * declaration form (export vs const) are ignored — only the values are the
 * cross-copy contract.
 */
function extractTrigramMap(source: string, rel: string): string {
  const decl = source.indexOf('FACE_TRIGRAM: Record')
  const braceStart = source.indexOf('{', decl)
  const braceEnd = source.indexOf('\n}', braceStart)
  if (decl === -1 || braceStart === -1 || braceEnd === -1) {
    throw new Error(`Could not locate the FACE_TRIGRAM object in ${rel}`)
  }
  const body = source.slice(braceStart + 1, braceEnd)
  const entries = [...body.matchAll(/(\w+)\s*:\s*'([^']+)'/g)].map(([, k, v]) => `${k}=${v}`).sort()
  if (entries.length === 0) {
    throw new Error(`FACE_TRIGRAM in ${rel} parsed to zero entries`)
  }
  return entries.join(';')
}

let failed = false

// 1. FACE_META block — byte-identical
if (sha(extractFaceBlock(read(TYPES_APP), TYPES_APP)) !== sha(extractFaceBlock(read(TYPES_PKG), TYPES_PKG))) {
  console.error(
    '✗ Face metadata lockstep: GameMasterFace / GAME_MASTER_FACES / FACE_META differ.\n' +
      `  App (canonical): ${TYPES_APP}\n` +
      `  Core (mirror):   ${TYPES_PKG}\n` +
      '  Sync the block in the bars-core copy to match the app source.',
  )
  failed = true
}

// 2. FACE_TRIGRAM — same face→trigram values
if (extractTrigramMap(read(ICHING_APP), ICHING_APP) !== extractTrigramMap(read(ICHING_PKG), ICHING_PKG)) {
  console.error(
    '✗ Face trigram lockstep: FACE_TRIGRAM values differ.\n' +
      `  App (canonical): ${ICHING_APP}\n` +
      `  Core (mirror):   ${ICHING_PKG}\n` +
      '  Sync the face→trigram values in the bars-core copy to match the app source.',
  )
  failed = true
}

if (failed) {
  process.exit(1)
}

console.log('✓ Face metadata + trigram lockstep (app ↔ bars-core)')
