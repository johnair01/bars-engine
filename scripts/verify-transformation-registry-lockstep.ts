/**
 * Ensures `packages/bars-core/src/transformation-moves` stays lockstep with
 * `src/lib/transformation-move-registry` (canonical app source).
 *
 * - registry.ts + types.ts: byte-identical
 * - services.ts: identical after removing `import` lines (bars-core uses `../archetype-overlay` vs `@/lib/...`)
 *
 * Run: npx tsx scripts/verify-transformation-registry-lockstep.ts
 * Wired: npm run verify:transformation-registry-lockstep → verify:build-reliability
 */

import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

function sha(s: string): string {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex')
}

/** Remove import statements including multi-line `import { … } from '…'`. */
function stripImportBlocks(source: string): string {
  return source
    .split('\n')
    .filter((line) => !/^\s*import\b/.test(line) && !/^\s*}\s*from\s/.test(line))
    .join('\n')
}

const pairs: Array<{ label: string; app: string; pkg: string; stripImports?: boolean }> = [
  { label: 'registry.ts', app: 'src/lib/transformation-move-registry/registry.ts', pkg: 'packages/bars-core/src/transformation-moves/registry.ts' },
  { label: 'types.ts', app: 'src/lib/transformation-move-registry/types.ts', pkg: 'packages/bars-core/src/transformation-moves/types.ts' },
  {
    label: 'services.ts (logic only)',
    app: 'src/lib/transformation-move-registry/services.ts',
    pkg: 'packages/bars-core/src/transformation-moves/services.ts',
    stripImports: true,
  },
]

let failed = false
for (const { label, app, pkg, stripImports } of pairs) {
  const a = read(app)
  const b = read(pkg)
  const ca = stripImports ? stripImportBlocks(a) : a
  const cb = stripImports ? stripImportBlocks(b) : b
  if (sha(ca) !== sha(cb)) {
    console.error(`✗ Transformation registry lockstep: ${label} differs.\n  App:  ${app}\n  Core: ${pkg}`)
    if (stripImports) {
      console.error('  Sync packages/bars-core/.../services.ts from the app file; keep import from ../archetype-overlay')
    }
    failed = true
  }
}

if (failed) {
  process.exit(1)
}

console.log('✓ Transformation move registry lockstep (app ↔ bars-core)')
