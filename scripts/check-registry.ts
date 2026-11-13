#!/usr/bin/env tsx
/**
 * Registry freshness
 *
 * Fails when public/registry.json no longer matches the routes in src, so a route added without refreshing the registry
 * is caught by `npm run check` instead of showing up as a changed file after a build. Nothing is written: the check
 * renders the file the build would write and compares the two.
 *
 * Usage:
 *   npm run check:registry
 */
import * as fs from 'fs'
import * as path from 'path'
import { buildRegistry, render } from './build-registry'

async function main() {
  const target = path.join(process.cwd(), 'public', 'registry.json')
  const committed = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null
  const wouldWrite = render(await buildRegistry(), committed)

  if (wouldWrite === committed) {
    console.log('public/registry.json matches the routes in src.')
    return
  }
  console.error('public/registry.json does not match the routes in src; run npm run build:registry and commit it.')
  process.exit(1)
}

main().catch(error => {
  console.error('registry check error:', error)
  process.exit(1)
})
