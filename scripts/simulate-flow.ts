#!/usr/bin/env npx tsx
/**
 * Flow simulator CLI (DT / flow-simulator-cli).
 * Run: npm run simulate -- <path-to-flow.json> [--verbose] [--json] [--actor <id>] [--seed <n>]
 * Optional subcommand: npm run simulate -- flow <path>  (same as without "flow")
 * Validate only: npm run simulate -- validate <path-to-flow.json>
 *
 * @see .specify/specs/flow-simulator-cli/spec.md
 * @see .specify/specs/transformation-simulation-harness/spec.md — quest subcommand
 */

import * as fs from 'fs'
import * as path from 'path'
import { simulateFlow } from '../src/lib/simulation/simulateFlow'
import { getSimulatedActorRole } from '../src/lib/simulation/actors'
import { validateFlowSchema } from '../src/lib/simulation/validateFlowSchema'
import { SIMULATE_SUBCOMMANDS } from '../src/lib/simulation/integrationContract'
import { simulateQuest } from '../src/lib/transformation-simulation/simulateQuest'
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
  let rest = [...args]
  // Optional unified subcommand: `flow` (explicit no-op alias for tooling that passes subcommands)
  if (rest[0] === 'flow' && rest[1] !== undefined && !rest[1].startsWith('--')) {
    rest = rest.slice(1)
  }

  const jsonMode = rest.includes('--json')
  const verboseMode = rest.includes('--verbose')
  const actorIdx = rest.indexOf('--actor')
  const actorId = actorIdx >= 0 ? rest[actorIdx + 1] : 'default'
  const seedIdx = rest.indexOf('--seed')
  const seed = seedIdx >= 0 && rest[seedIdx + 1] ? parseInt(rest[seedIdx + 1], 10) : undefined
  const validateOnly = rest[0] === 'validate'
  const positional = rest.filter((a, i) => {
    if (a.startsWith('--')) return false
    if (actorIdx >= 0 && i === actorIdx + 1) return false
    if (seedIdx >= 0 && i === seedIdx + 1) return false
    return true
  })
  const paths = validateOnly ? positional.slice(1) : positional
  return { jsonMode, verboseMode, actorId, seed, validateOnly, paths }
}

type QuestCliArgs = {
  narrative: string
  nation?: string
  archetype?: string
  seed?: number
  json: boolean
  verbose: boolean
  log: boolean
}

function parseQuestCliArgs(raw: string[]): QuestCliArgs {
  const out: QuestCliArgs = {
    narrative: '',
    json: raw.includes('--json'),
    verbose: raw.includes('--verbose'),
    log: raw.includes('--log'),
  }
  const positional: string[] = []
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i]
    if (a === '--json' || a === '--verbose' || a === '--log') continue
    if (a === '--narrative' && raw[i + 1]) {
      out.narrative = raw[++i]
      continue
    }
    if (a === '--nation' && raw[i + 1]) {
      out.nation = raw[++i]
      continue
    }
    if (a === '--archetype' && raw[i + 1]) {
      out.archetype = raw[++i]
      continue
    }
    if (a === '--seed' && raw[i + 1]) {
      out.seed = parseInt(raw[i + 1], 10)
      i++
      continue
    }
    if (!a.startsWith('--')) positional.push(a)
  }
  if (!out.narrative && positional.length) out.narrative = positional.join(' ').trim()
  return out
}

function writeQuestLog(result: ReturnType<typeof simulateQuest>): string {
  const dir = path.join(process.cwd(), 'simulation-logs')
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${result.simulation_id}.json`)
  fs.writeFileSync(file, JSON.stringify({ mode: 'quest', at: new Date().toISOString(), ...result }, null, 2), 'utf-8')
  return file
}

function runQuestMode(raw: string[]) {
  const q = parseQuestCliArgs(raw)
  if (!q.narrative) {
    console.error('Usage: npm run simulate -- quest --narrative "..." [--nation argyra] [--archetype truth-seer] [--seed N] [--json] [--verbose] [--log]')
    console.error('Or: npm run simulate -- quest "I am afraid of failing" --json')
    process.exit(1)
  }
  try {
    const result = simulateQuest(q.narrative, {
      nationId: q.nation ?? null,
      archetypeKey: q.archetype ?? null,
      seed: q.seed,
    })
    if (q.log) {
      const f = writeQuestLog(result)
      if (!q.json && q.verbose) console.error(`Wrote ${f}`)
    }
    if (q.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.log(`simulation_id: ${result.simulation_id}`)
      console.log(`lock: ${result.lock_type} | moves: ${result.moves_selected.join(', ')}`)
      if (q.verbose) {
        console.log('top encounter:', result.encounter_geometry.ranked_encounters[0]?.name ?? '(none)')
        console.log('prompts:', Object.keys(result.generated_prompts).join(', '))
      }
    }
    process.exit(0)
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e))
    process.exit(1)
  }
}

function printUsageAndExit(): never {
  console.error('Usage: npm run simulate -- [flow] [validate] [quest] ...')
  console.error('  Flow: npm run simulate -- <path-to-flow.json> [--verbose] [--json] [--actor <id>] [--seed <n>]')
  console.error('  Quest: npm run simulate -- quest --narrative "..." [--nation id] [--archetype slug] [--seed N] [--json] [--log]')
  console.error('  Validate: npm run simulate -- validate <path-to-flow.json>')
  console.error(`  Subcommands: ${SIMULATE_SUBCOMMANDS.join(', ')}`)
  process.exit(1)
}

function main() {
  const args = process.argv.slice(2)
  if (args[0] === 'quest') {
    runQuestMode(args.slice(1))
    return
  }

  const { jsonMode, verboseMode, actorId, seed, validateOnly, paths } = parseArgs(args)

  if (paths.length === 0) {
    printUsageAndExit()
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
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`${p}: ERROR ${msg}`)
      results.push({
        path: p,
        result: {
          status: 'fail',
          flow_id: '',
          visited_nodes: [],
          events_emitted: [],
          state_changes: [],
          warnings: [],
          errors: [msg],
          completion_reached: false,
        },
      })
    }
  }

  if (jsonMode) {
    console.log(JSON.stringify(results.length === 1 ? results[0].result : results, null, 2))
  }

  const hasFail = results.some((r) => r.result.status === 'fail')
  process.exit(hasFail ? 1 : 0)
}

main()
