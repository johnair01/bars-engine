#!/usr/bin/env node
/** Says when node_modules holds a version package-lock.json does not name, which is how a lint or type failure turns
 * into a phantom: on 2026-11-12 six "Cannot access refs during render" errors came from eslint-plugin-react-hooks
 * 7.1.1 sitting in a tree the lock pins at 7.0.1, and they went away with `npm ci` and no code change.
 *
 * Prints one line per drifted package, nothing when the tree matches. A package that is not installed at all is npm's
 * own complaint (`npm ci` names it), so it is not repeated here. */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'))
const drifted = []
let seen = 0

for (const [key, want] of Object.entries(lock.packages ?? {})) {
  if (!key.startsWith('node_modules/') || !want.version) continue
  let have
  try {
    have = JSON.parse(fs.readFileSync(path.join(root, key, 'package.json'), 'utf8')).version
  } catch {
    continue // not installed; npm ci reports that itself
  }
  seen++
  if (have !== want.version) drifted.push(`${key.slice('node_modules/'.length)} ${have}, lock says ${want.version}`)
}

if (drifted.length) {
  process.stdout.write(drifted.slice(0, 12).join('\n') + '\n')
  if (drifted.length > 12) process.stdout.write(`… and ${drifted.length - 12} more\n`)
  process.exit(3)
}
process.exit(0)
