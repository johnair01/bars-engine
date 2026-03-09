#!/usr/bin/env npx tsx
/**
 * Flow simulator CLI. Run: npm run simulate -- <path-to-flow.json> [--verbose] [--json] [--actor <id>]
 */

import * as fs from 'fs'
import * as path from 'path'
import { simulateFlow } from '../src/lib/simulation/simulateFlow'
import { getSimulatedActorRole } from '../src/lib/simulation/actors'
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

function main() {
  const args = process.argv.slice(2)
  const jsonMode = args.includes('--json')
  const verboseMode = args.includes('--verbose')
  const actorIdx = args.indexOf('--actor')
  const actorId = actorIdx >= 0 ? args[actorIdx + 1] : 'default'
  const paths = args.filter((a) => !a.startsWith('--') && (actorIdx < 0 || args.indexOf(a) !== actorIdx + 1))

  if (paths.length === 0) {
    console.error('Usage: npm run simulate -- <path-to-flow.json> [--verbose] [--json] [--actor <id>]')
    console.error('Example: npm run simulate -- fixtures/flows/orientation_linear_minimal.json --verbose')
    process.exit(1)
  }

  const capabilities = getCapabilitiesForActor(actorId)
  const results: { path: string; result: ReturnType<typeof simulateFlow> }[] = []

  for (const p of paths) {
    try {
      const flow = loadFlow(p)
      const result = simulateFlow({
        flow,
        actor_capabilities: capabilities,
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
