/**
 * Fail if a file with 'use server' re-exports types in forms that Next.js / Turbopack
 * may treat as runtime exports (no binding → build error).
 *
 * Allowed: export type Name = … / export interface (local aliases).
 * Disallowed here: export type { X } … / export type { X } from '…'
 *                  export { type X } / export { type X as Y }
 *
 * Run: npx tsx scripts/verify-server-action-type-reexports.ts
 */
import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative } from 'path'

const ROOT = join(process.cwd(), 'src')
const BAD: { file: string; line: number; text: string; reason: string }[] = []

const RE_EXPORT_BLOCK = /export\s+type\s*\{/
const RE_INLINE_TYPE_IN_BRACES = /export\s*\{[^}]*\btype\s+[\w$.]/

function walk(dir: string, out: string[]) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name)
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue
      walk(p, out)
    } else if (ent.isFile() && ent.name.endsWith('.ts')) {
      out.push(p)
    }
  }
}

function hasUseServer(content: string): boolean {
  const head = content.slice(0, 4000)
  return /^\s*['"]use server['"]\s*;?\s*$/m.test(head)
}

function checkFile(absPath: string) {
  const content = readFileSync(absPath, 'utf-8')
  if (!hasUseServer(content)) return

  const rel = relative(process.cwd(), absPath)
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (RE_EXPORT_BLOCK.test(line)) {
      BAD.push({
        file: rel,
        line: i + 1,
        text: line.trim(),
        reason: '`export type { ... }` from a "use server" module breaks Turbopack server-action barrels; import types from @/lib/*.ts instead.',
      })
    }
    if (/export\s*\{/.test(line) && /\btype\s+[\w$.]/.test(line) && RE_INLINE_TYPE_IN_BRACES.test(line)) {
      BAD.push({
        file: rel,
        line: i + 1,
        text: line.trim(),
        reason: '`export { type X }` from a "use server" module can fail the server-actions proxy; import types from @/lib/*.ts instead.',
      })
    }
  }
}

const files: string[] = []
if (statSync(ROOT, { throwIfNoEntry: false })) {
  walk(ROOT, files)
}

for (const f of files) {
  checkFile(f)
}

if (BAD.length) {
  console.error('\n❌ Server action type re-exports (fix before merge):\n')
  for (const b of BAD) {
    console.error(`  ${b.file}:${b.line}`)
    console.error(`    ${b.text}`)
    console.error(`    → ${b.reason}\n`)
  }
  process.exit(1)
}

console.log('✓ No disallowed type re-exports in "use server" files.')
