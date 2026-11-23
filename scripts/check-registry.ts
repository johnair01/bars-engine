#!/usr/bin/env tsx
/**
 * Registry freshness
 *
 * Fails when public/registry.json no longer matches the routes in src, so a route added without refreshing the registry
 * is caught by `npm run check` instead of showing up as a changed file after a build. Nothing is written: the check
 * renders the file the build would write and compares the two.
 *
 * Routes carry no line number any more, so an edit above a route cannot change this file: #849 added seven lines to
 * src/app/api/mcp/route.ts and reddened the Frontend check on main and on every pull request, because the committed
 * copy still held the numbers 755 and 825. The comparison drops `lineNumber` and `generatedAt` from both sides until a
 * build refreshes the committed copy. Paths, methods, params, query, relationships and descriptions still have to match.
 *
 * Usage:
 *   npm run check:registry
 */
import * as fs from 'fs'
import * as path from 'path'
import { buildRegistry, render } from './build-registry'

function stripVolatileFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripVolatileFields)
  if (value !== null && typeof value === 'object') {
    const copy: Record<string, unknown> = {}
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'lineNumber' || key === 'generatedAt') continue
      copy[key] = stripVolatileFields(inner)
    }
    return copy
  }
  return value
}

function withoutVolatileFields(text: string): string {
  return JSON.stringify(stripVolatileFields(JSON.parse(text)))
}

async function main() {
  const target = path.join(process.cwd(), 'public', 'registry.json')
  const committed = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null
  const wouldWrite = render(await buildRegistry(), committed)

  if (committed !== null && withoutVolatileFields(wouldWrite) === withoutVolatileFields(committed)) {
    console.log('public/registry.json matches the routes in src (line numbers and generatedAt ignored).')
    return
  }
  console.error('public/registry.json does not match the routes in src; run npm run build:registry and commit it.')
  process.exit(1)
}

main().catch(error => {
  console.error('registry check error:', error)
  process.exit(1)
})
