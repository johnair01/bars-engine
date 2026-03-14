#!/usr/bin/env npx tsx
import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

/**
 * Run parallel feature work — DC-6 Six-Face Parallel Handling
 * Per .specify/specs/deftness-uplevel-character-daemons-agents/six-face-parallel-handling/spec.md
 *
 * Usage:
 *   npm run run:parallel-feature -- "Add daemon discovery to onboarding"
 *   npm run run:parallel-feature -- --feature "Add daemon discovery" --decompose-only
 */

import {
  decomposeFeature,
  runParallelFeatureWork,
  synthesizeFeatureOutputs,
} from '../src/lib/feature-decomposition'

function flag(name: string): string | null {
  const eqForm = process.argv.find((a) => a.startsWith(`--${name}=`))
  if (eqForm) return eqForm.split('=').slice(1).join('=')
  const idx = process.argv.indexOf(`--${name}`)
  if (idx !== -1 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith('--')) {
    return process.argv[idx + 1]
  }
  return null
}

const FEATURE_ARG = flag('feature') ?? process.argv.find((a) => !a.startsWith('--'))
const DECOMPOSE_ONLY = process.argv.includes('--decompose-only')
async function main() {
  const featureDesc = FEATURE_ARG ?? 'Feature request (provide as first arg or --feature=...)'
  if (!FEATURE_ARG) {
    console.error('Usage: npm run run:parallel-feature -- "Feature description"')
    console.error('       npm run run:parallel-feature -- --feature "Feature description" --decompose-only')
    process.exit(1)
  }

  const featureId = `feature-${Date.now()}`

  console.log('Decomposing feature...')
  const { tasks } = decomposeFeature(featureDesc)

  console.log('\n## Decomposed Tasks\n')
  for (const t of tasks) {
    const deps = t.dependencies?.length ? ` (deps: ${t.dependencies.join(', ')})` : ''
    console.log(`- [${t.face}] ${t.task}${deps}`)
  }

  if (DECOMPOSE_ONLY) {
    console.log('\n(--decompose-only: skipping parallel run and synthesis)')
    return
  }

  console.log('\nRunning parallel work...')
  const outputs = await runParallelFeatureWork(featureId, tasks)

  console.log('\n## Outputs\n')
  for (const [face, out] of Object.entries(outputs)) {
    const str = typeof out === 'object' && out && 'error' in out
      ? `Error: ${(out as { error: string }).error}`
      : JSON.stringify(out, null, 2).slice(0, 500)
    console.log(`### ${face}\n${str}\n`)
  }

  console.log('Synthesizing...')
  const { synthesized, conflicts } = synthesizeFeatureOutputs(featureId, outputs)

  console.log('\n## Synthesis\n')
  console.log(typeof synthesized === 'string' ? synthesized : JSON.stringify(synthesized, null, 2))
  if (conflicts?.length) {
    console.log('\n## Conflicts\n')
    for (const c of conflicts) console.log(`- ${c}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
