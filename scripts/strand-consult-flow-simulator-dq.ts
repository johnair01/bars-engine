#!/usr/bin/env npx tsx
/**
 * Consult Game Master agents on DQ (Flow Simulator CLI) — extending utility and
 * blockers for autonomous agents testing features and creating content.
 *
 * Usage:
 *   npm run strand:consult:dq
 *   # or with explicit backend:
 *   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 npx tsx scripts/strand-consult-flow-simulator-dq.ts
 *
 * Requires: Backend running (npm run dev:backend), OPENAI_API_KEY in .env.local
 * Output: .specify/specs/flow-simulator-cli/STRAND_CONSULT.md
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const backendIdx = process.argv.indexOf('--backend')
const next = process.argv[backendIdx + 1]
const backendArg =
  backendIdx >= 0 && next && !next.startsWith('--')
    ? next
    : process.argv.find((a) => a.startsWith('--backend='))?.slice('--backend='.length)
const BACKEND_URL = backendArg || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

const CONSULT_QUESTION = `I need your expertise on the Flow Simulator CLI (DQ) — a lightweight simulation environment for quest flows and onboarding. The goal is to extend its utility so **autonomous agents can test features and create content** without human-in-the-loop.

**Current state:**
- simulateFlow(flow, context) — node traversal, action execution, capability checks, event emission
- Bruised Banana fixtures (campaign_intro, identity_selection, intended_impact_bar)
- Bounded actor roles (Librarian, Collaborator, Witness) — scaffold only
- simulateFlowWithActors, proposeActorAction — stubs
- CLI: npm run simulate

**Related specs:**
- transformation-simulation-harness: bars simulate quest, agent, campaign, onboarding
- npc-agent-game-loop-simulation: pickQuestForAgent, simulateAgentGameLoop
- npc-simulated-player-content-ecology: simulated personas, content creation

**Questions:**
1. **Extending utility**: What would make the Flow Simulator most useful for autonomous agents? What hooks, APIs, or outputs would agents need to test features end-to-end?
2. **Blockers for agent testing**: What blockers prevent autonomous agents from testing features (e.g. onboarding, quest completion, BAR creation)? Schema gaps? Missing APIs? Determinism?
3. **Blockers for agent content creation**: What prevents agents from creating content (quests, BARs, fixtures) that can be validated by the simulator? Approval gates? Format contracts? Traceability?
4. **Integration path**: How should DQ (flow-simulator-cli) relate to transformation-simulation-harness and npc-agent-game-loop? One unified CLI? Or separate tools with shared contracts?

Synthesize into structured recommendations. Be concise.`

const ARCHITECT_TASK = `[Flow Simulator DQ — Extending Utility & Agent Blockers]

You are the Architect. Propose:

1. **Extending utility**: What APIs, hooks, or outputs would agents need to test features end-to-end? (e.g. simulateFlow returns structured events; agent can assert on events_emitted; fixture format contract; replay capability)

2. **Agent testing blockers**: Schema gaps? Missing APIs? Determinism requirements? What must exist before an agent can autonomously run "test onboarding flow" and get pass/fail?

3. **Agent content creation blockers**: What prevents agents from creating quests, BARs, fixtures that the simulator validates? Approval gates? Format contracts? creatorType/traceability?

4. **Integration**: How should flow-simulator-cli relate to transformation-simulation-harness and npc-agent-game-loop? Unified CLI vs separate tools?

Put your recommendations in the reasoning field. Be structured and concise.`

const REGENT_TASK = `[Flow Simulator DQ — Order & Rules]

You are the Regent. Govern the path to autonomous agent testing and content creation. Propose:

1. **Testing rules**: What rules must an agent follow when testing? (e.g. deterministic seed; no production DB; fixture validation before live run; audit trail)

2. **Content creation rules**: If an agent creates a quest or BAR, what gates apply? Admin approval? creatorType? Must content be validated by simulator before publication?

3. **Boundary rules**: What must never happen? (e.g. agent mutating production; agent creating untraceable content; agent bypassing validation)

Put your recommendations in the reasoning field. Be structured and concise.`

const CHALLENGER_TASK = `[Flow Simulator DQ — Blockers & Risks]

You are the Challenger. Propose:

1. **Blockers**: What are the top 3–5 blockers preventing autonomous agents from testing features? Be specific. (e.g. "No API to run completeQuest from agent context" or "Fixtures don't cover BAR creation path")

2. **Content creation blockers**: What prevents agents from creating valid content? Format drift? Missing validation? Approval bottleneck?

3. **Risks**: What could go wrong if we enable agent testing/content creation now? (e.g. polluted analytics, untraceable mutations, fixture drift)

Put your recommendations in the reasoning field. Be structured and concise.`

const SAGE_MERGE_QUESTION = (architect: string, regent: string, challenger: string) => `You are the Sage. The Architect, Regent, and Challenger have each proposed recommendations for extending the Flow Simulator (DQ) and unblocking autonomous agents for testing and content creation. Synthesize their views into:

1. **Unified extension recommendations** — What to build first (prioritized)
2. **Blockers to address** — Ordered list (highest impact first)
3. **Integration path** — How flow-simulator-cli, transformation-simulation-harness, and npc-agent-game-loop should relate
4. **Risks and mitigations** — What to watch for

Be concise. Output as structured sections.`

async function sageConsult(question?: string): Promise<{ synthesis: string; consulted_agents?: string[] }> {
  const q = question ?? CONSULT_QUESTION
  const res = await fetch(`${BACKEND_URL}/api/agents/sage/consult`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: q }),
  })
  if (!res.ok) throw new Error(`Sage consult failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return {
    synthesis: data.output?.synthesis ?? JSON.stringify(data.output),
    consulted_agents: data.output?.consulted_agents ?? [],
  }
}

async function faceTask(face: string, task: string): Promise<{ reasoning?: string; output?: unknown }> {
  const res = await fetch(`${BACKEND_URL}/api/agents/${face}/task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, feature_id: 'flow-simulator-dq' }),
  })
  if (!res.ok) throw new Error(`${face} task failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  const out = data.output as Record<string, unknown>
  return {
    reasoning: out?.reasoning as string | undefined,
    output: out,
  }
}

function formatFallback(out: unknown): string {
  if (typeof out === 'string') return out
  if (out && typeof out === 'object') {
    const o = out as Record<string, unknown>
    if (o.reasoning) return String(o.reasoning)
  }
  return '```json\n' + JSON.stringify(out, null, 2) + '\n```'
}

async function main() {
  console.log('Consulting Game Master on Flow Simulator DQ...\n')
  console.log(`Backend: ${BACKEND_URL}`)

  try {
    const health = await fetch(`${BACKEND_URL}/api/health`)
    if (!health.ok) throw new Error('Health check failed')
  } catch (e) {
    console.error('\n❌ Backend not reachable. Start with: npm run dev:backend')
    process.exit(1)
  }

  console.log('1. Consulting Sage (routes to Architect + Regent)...')
  const sageResult = await sageConsult()

  console.log('2. Consulting Architect directly...')
  const architectResult = await faceTask('architect', ARCHITECT_TASK)

  console.log('3. Consulting Regent directly...')
  const regentResult = await faceTask('regent', REGENT_TASK)

  console.log('4. Consulting Challenger directly...')
  const challengerResult = await faceTask('challenger', CHALLENGER_TASK)

  console.log('5. Sage: synthesizing unified recommendations...')
  const architectText = architectResult.reasoning || formatFallback(architectResult.output)
  const regentText = regentResult.reasoning || formatFallback(regentResult.output)
  const challengerText = challengerResult.reasoning || formatFallback(challengerResult.output)
  const sageMergeResult = await sageConsult(SAGE_MERGE_QUESTION(architectText, regentText, challengerText))

  const outputDir = join(process.cwd(), '.specify', 'specs', 'flow-simulator-cli')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = join(outputDir, 'STRAND_CONSULT.md')

  const markdown = `# Strand Consultation — Flow Simulator DQ

**Date**: ${new Date().toISOString().slice(0, 10)}
**Source**: \`npm run strand:consult:dq\`

**Topic**: Extending utility; blockers for autonomous agents testing features and creating content.

---

## Sage Synthesis (initial routing)

${sageResult.synthesis}

*Consulted agents: ${sageResult.consulted_agents?.join(', ') || 'N/A'}*

---

## Architect Response (extending utility, blockers, integration)

${architectText}

---

## Regent Response (order, rules, boundaries)

${regentText}

---

## Challenger Response (blockers, risks)

${challengerText}

---

## Sage Synthesis (unified recommendations)

${sageMergeResult.synthesis}

---

## Next Steps

1. Prioritize blockers from Challenger + Architect
2. Add extension recommendations to flow-simulator-cli spec or transformation-simulation-harness
3. Define integration contract between DQ, harness, and npc-agent-game-loop
`

  writeFileSync(outputPath, markdown, 'utf-8')
  console.log(`\n✅ Consultation written to ${outputPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
