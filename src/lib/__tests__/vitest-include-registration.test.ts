import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * The guard that keeps a vitest suite from silently not running.
 *
 * `vitest.config.ts` lists the files it runs in a hand-maintained `include`
 * allowlist, because this repo names two harnesses the same: some `*.test.ts`
 * files are vitest suites, and ~100 others are `tsx` + `node:assert` scripts that
 * vitest cannot run. A glob over `*.test.ts` would sweep the node:assert files in
 * and break them, so the allowlist stays — but nothing stopped a new vitest file
 * from being left off it, and a suite that is not in the list is not run and not
 * reported. Day 13's suites shipped that way and sat unrun until this guard.
 *
 * This test is cheap and exact: it finds every file under `src` that imports from
 * vitest (the reliable mark of a vitest suite) and asserts each is registered. It
 * does not touch the node:assert scripts. When it fails, the fix is one line per
 * file in `vitest.config.ts` — add the path, and the suite runs from then on.
 */

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'src')
const CONFIG = path.join(ROOT, 'vitest.config.ts')

/** A file is a vitest suite if it imports from the vitest package. */
const IMPORTS_VITEST = /(?:import|require)\b[^\n]*['"]vitest['"]/

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.git') walk(full, out)
    } else if (/\.test\.tsx?$/.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

function vitestSuitesUnderSrc(): string[] {
  return walk(SRC)
    .filter((file) => IMPORTS_VITEST.test(readFileSync(file, 'utf-8')))
    .map((file) => path.relative(ROOT, file))
    .sort()
}

function registeredIncludes(): Set<string> {
  const config = readFileSync(CONFIG, 'utf-8')
  const matches = config.match(/src\/[^'"]+\.test\.tsx?/g) ?? []
  return new Set(matches)
}

describe('vitest include registration', () => {
  it('registers every vitest suite under src in vitest.config.ts', () => {
    const registered = registeredIncludes()
    const missing = vitestSuitesUnderSrc().filter((file) => !registered.has(file))
    expect(
      missing,
      missing.length
        ? `These vitest suites are not in vitest.config.ts include, so they do not run:\n  ${missing.join('\n  ')}\nAdd each path to the include array.`
        : '',
    ).toEqual([])
  })

  it('finds itself, proving the detector actually matches vitest suites', () => {
    // A regression guard on the guard: if the detector stopped matching, this
    // list would be empty and the test above would pass vacuously.
    expect(vitestSuitesUnderSrc()).toContain('src/lib/__tests__/vitest-include-registration.test.ts')
  })
})
