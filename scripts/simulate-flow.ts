#!/usr/bin/env npx tsx
/**
 * Flow simulator CLI. Run: npm run simulate -- <path-to-flow.json> [--verbose] [--json] [--actor <id>] [--seed <n>]
 * Validate only: npm run simulate -- validate <path-to-flow.json>
 */

import * as fs from 'fs'
import * as path from 'path'
import { simulateFlow } from '../src/lib/simulation/simulateFlow'
import { getSimulatedActorRole } from '../src/lib/simulation/actors'
import { validateFlowSchema } from '../src/lib/simulation/validateFlowSchema'
import type { FlowJSON } from '../src/lib/simulation/types'

const DEFAULT_ACTOR_CAPS: Record<string, string[]> = {
  default: ['observe', 'create', 'continue', 'choose'],
  human_participant: ['observe', 'choose', 'create', 'continue'],
}

function getCapabilitiesForActor(actorId: string): string[] {
  const role = getSimulatedActorRole(actorId)
  if (role) return role.flow_capabilities
  return DEFAULT_ACTOR_CAPS[actorId] ?? DEFAULT_ACTOR_CAPS.default
}

function loadFlow(filePath: string): FlowJSON {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath)
  const raw = fs.readFileSync(abs, 'utf-8')
  return JSON.parse(raw) as FlowJSON
}

function parseArgs(args: string[]) {
  const jsonMode = args.includes('--json')
  const verboseMode = args.includes('--verbose')
  const actorIdx = args.indexOf('--actor')
  const actorId = actorIdx >= 0 ? args[actorIdx + 1] : 'default'
  const seedIdx = args.indexOf('--seed')
  const seed = seedIdx >= 0 && args[seedIdx + 1] ? parseInt(args[seedIdx + 1], 10) : undefined
  const validateOnly = args[0] === 'validate'
  const positional = args.filter((a, i) => {
    if (a.startsWith('--')) return false
    if (actorIdx >= 0 && i === actorIdx + 1) return false
    if (seedIdx >= 0 && i === seedIdx + 1) return false
    return true
  })
  const paths = validateOnly ? positional.slice(1) : positional
  return { jsonMode, verboseMode, actorId, seed, validateOnly, paths }
}

function main() {
  const args = process.argv.slice(2)
  const { jsonMode, verboseMode, actorId, seed, validateOnly, paths } = parseArgs(args)

  if (paths.length === 0) {
    console.error('Usage: npm run simulate -- [validate] <path-to-flow.json> [--verbose] [--json] [--actor <id>] [--seed <n>]')
    console.error('Example: npm run simulate -- fixtures/flows/orientation_linear_minimal.json --verbose')
    console.error('Validate: npm run simulate -- validate fixtures/onboarding/bruised-banana/campaign_intro.json')
    process.exit(1)
  }

  if (validateOnly) {
    let allValid = true
    for (const p of paths) {
      try {
        const flow = JSON.parse(fs.readFileSync(path.isAbsolute(p) ? p : path.join(process.cwd(), p), 'utf-8'))
        const errors = validateFlowSchema(flow)
        if (errors.length === 0) {
          console.log(`${path.basename(p)}: valid`)
        } else {
          allValid = false
          console.error(`${path.basename(p)}: invalid`)
          errors.forEach((e) => console.error(`  ${e.path}: ${e.message}`))
        }
      } catch (err) {
        allValid = false
        console.error(`${p}: ERROR ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    process.exit(allValid ? 0 : 1)
  }

  const capabilities = getCapabilitiesForActor(actorId)
  const results: { path: string; result: ReturnType<typeof simulateFlow> }[] = []

  for (const p of paths) {
    try {
      const flow = loadFlow(p)
      const schemaErrors = validateFlowSchema(flow)
      if (schemaErrors.length > 0) {
        throw new Error(schemaErrors.map((e) => `${e.path}: ${e.message}`).join('; '))
      }
      const result = simulateFlow({
        flow,
        actor_capabilities: capabilities,
        seed,
      })
      results.push({ path: p, result })

      if (jsonMode) continue

      if (verboseMode) {
        console.log(`\nSimulating flow: ${flow.flow_id}`)
        result.visited_nodes.forEach((id, i) => {
          const node = flow.nodes.find((n) => n.id === id)
          const type = node?.type ?? '?'
          const action = node?.actions[0]
          const next = action?.next_node_id ?? 'terminal'
          console.log(`  [${i + 1}] ${id} (${type}) -> ${next}`)
        })
        console.log(`Events: ${result.events_emitted.join(', ') || '(none)'}`)
        if (result.errors.length) console.log(`Errors: ${result.errors.join('; ')}`)
      }

      const status = result.status.toUpperCase()
      console.log(`${path.basename(p)}: ${status}`)
    } catch (err) {
      console.error(`${p}: ERROR ${err instanceof Error ? err.message : String(err)}`)
      if (jsonMode) {
        results.push({
          path: p,
          result: {
            status: 'fail',
            flow_id: '',
            visited_nodes: [],
            events_emitted: [],
            state_changes: [],
            warnings: [],
            errors: [err instanceof Error ? err.message : String(err)],
            completion_reached: false,
          },
        })
      }
    }
  }

  if (jsonMode) {
    console.log(JSON.stringify(results.length === 1 ? results[0].result : results, null, 2))
  }

  const hasFail = results.some((r) => r.result.status === 'fail')
  process.exit(hasFail ? 1 : 0)
}

main()
