#!/usr/bin/env npx tsx
/**
 * Consult Game Master agents on Admin Agent Forge (EJ) spec reevaluation.
 *
 * The system has changed significantly since EJ was added to the backlog.
 * This script invokes Architect, Regent, Shaman, and Sage to reevaluate
 * how the Admin Agent Forge can work in the current version.
 *
 * Usage:
 *   npm run strand:consult:forge
 *   # or with explicit backend:
 *   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 npx tsx scripts/strand-consult-admin-agent-forge.ts
 *
 * Requires: Backend running (npm run dev:backend), OPENAI_API_KEY in .env.local
 * Output: .specify/specs/admin-agent-forge/GM_CONSULT_REEVALUATION.md
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

const CONSULT_QUESTION = `The Admin Agent Forge (EJ) spec was added to the backlog when the system looked different. We need to reevaluate how this feature can work in the current BARS Engine.

**Current system context** (what exists now):
- Shadow321Session, 321 flow, charge capture, persist321Session
- Emotional First Aid (EFA), EmotionalFirstAidSession
- Six Game Master faces: Shaman, Challenger, Regent, Architect, Diplomat, Sage
- Backend agents (FastAPI): architect, shaman, regent, challenger, diplomat, sage
- Strand system: multi-agent investigations, strand_run, strand-as-BAR
- Vibulons, mintVibulon, economy
- Instance, campaign, BarDeck, domain decks
- Nation, Archetype (playbook), NationMove
- Mind agent (create_agent, step) for NPC/simulated players

**Original EJ spec** (what was planned):
- Admin-only 3-2-1 shadow process with friction-gated vibeulon minting
- Cooldown by DeftnessScore; AgentSpec/AgentPatch for new/updated agents
- Routing targets: ARCHETYPE, NATION, CAMPAIGN, META_AGENT, GLOBAL_POLICY
- Private emotional data; public AgentDelta only

**Questions for the Game Master faces:**
1. How should the Forge integrate with existing 321 and EFA flows? (Avoid duplication; leverage Shadow321Session?)
2. AgentSpec/AgentPatch — do these map to existing agent models (Mind, backend agents)? Or are they a new abstraction?
3. DeftnessScore — does it exist? If not, how should cooldown scale?
4. Routing targets — do ARCHETYPE, NATION, CAMPAIGN, META_AGENT, GLOBAL_POLICY align with current schema?
5. What should be preserved vs. revised in the spec?

Synthesize into structured recommendations. Be concise.`

const ARCHITECT_TASK = `[Admin Agent Forge Reevaluation — Schema & Structure]

You are the Architect. The Admin Agent Forge (EJ) spec predates significant system changes. Reevaluate:

1. **Integration with 321/EFA**: How should the Forge relate to Shadow321Session and EmotionalFirstAidSession? Should ForgeSession extend or replace any of these? Avoid schema duplication.

2. **AgentSpec/AgentPatch**: The spec proposes AgentSpec (new agent) and AgentPatch (update existing). The system now has: Mind agent (create_agent, step), backend Game Master agents (architect, shaman, etc.). Do AgentSpec/AgentPatch map to Mind? To backend agent config? Propose a minimal schema that fits current architecture.

3. **Routing targets**: ARCHETYPE, NATION, CAMPAIGN, META_AGENT, GLOBAL_POLICY — do these align with Instance, Nation, Archetype, etc.? What IDs would target_id reference?

Put your recommendations in the reasoning field. Be structured and concise.`

const REGENT_TASK = `[Admin Agent Forge Reevaluation — Order & Rules]

You are the Regent. The Admin Agent Forge governs admin access to a 3-2-1 process that mints vibeulons and creates/patches agents. Reevaluate:

1. **Cooldown and DeftnessScore**: The spec says cooldown scales by DeftnessScore (0–3 → 7d, 4–6 → 5d, 7–10 → 3d). Does DeftnessScore exist in the schema? If not, propose a fallback (e.g. fixed 5-day cooldown, or derive from Player/Playbook).

2. **Eligibility gate**: distortion_intensity >= 5. Where does distortion_intensity come from? EFA intake? Manual admin self-report? Propose a minimal path.

3. **Governance**: Admin-only is correct. What other rules must hold? (e.g. routing required when minted; private data never exposed.)

Put your recommendations in the reasoning field. Be structured and concise.`

const SHAMAN_TASK = `[Admin Agent Forge Reevaluation — Emotional Process]

You are the Shaman. The Forge is a 3-2-1 shadow process — an Emotional First Aid (Clean Up) move. Reevaluate:

1. **3-2-1 alignment**: The spec has THIRD_PERSON, SECOND_PERSON, FIRST_PERSON stages with 6 unpacking questions + 7th (aligned step). How does this align with or differ from the existing 321 flow (Shadow321Runner, charge metabolism)? Should the Forge reuse 321 infrastructure or be a distinct admin-only variant?

2. **Friction and mint gate**: friction_start, friction_end, delta > 2 → mint. This is sound. Should friction be captured at session start only, or also at stage transitions?

3. **Emotional data privacy**: The Shaman witnesses. Private transcript, beliefs, distortion — never public. Agent deltas only. Is this sufficient? Any Shaman-specific concerns?

Put your recommendations in the reasoning field. Be structured and concise.`

const SAGE_MERGE_QUESTION = (architect: string, regent: string, shaman: string) => `You are the Sage. The Architect, Regent, and Shaman have each reevaluated the Admin Agent Forge (EJ) spec for the current BARS Engine. Synthesize their views into a single, actionable reevaluation.

**Architect's proposal:**
${architect}

**Regent's proposal:**
${regent}

**Shaman's proposal:**
${shaman}

Produce a unified reevaluation that:
1. Preserves what still makes sense (admin-only, friction-gated mint, 3-2-1 stages, private/public separation)
2. Revises what no longer fits (schema alignment, integration with 321/EFA, AgentSpec/AgentPatch mapping)
3. Proposes concrete next steps: what to add to the spec, what to remove, what to defer
4. Is minimal and implementable

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
  const output = data.output ?? data
  return {
    synthesis: typeof output === 'string' ? output : (output.synthesis ?? JSON.stringify(output)),
    consulted_agents: output.consulted_agents ?? [],
  }
}

async function faceTask(face: string, task: string): Promise<{ reasoning?: string; output?: unknown }> {
  const res = await fetch(`${BACKEND_URL}/api/agents/${face}/task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, feature_id: 'admin-agent-forge' }),
  })
  if (!res.ok) throw new Error(`${face} task failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  const out = (data.output ?? data) as Record<string, unknown>
  return {
    reasoning: out?.reasoning as string | undefined,
    output: out,
  }
}

async function main() {
  console.log('Consulting Game Master agents on Admin Agent Forge (EJ) reevaluation...\n')
  console.log(`Backend: ${BACKEND_URL}`)

  try {
    const health = await fetch(`${BACKEND_URL}/api/health`)
    if (!health.ok) throw new Error('Health check failed')
  } catch (e) {
    console.error('\n❌ Backend not reachable. Start with: npm run dev:backend')
    process.exit(1)
  }

  console.log('1. Consulting Sage (routes to relevant faces)...')
  const sageResult = await sageConsult()

  console.log('2. Consulting Architect (schema, structure)...')
  const architectResult = await faceTask('architect', ARCHITECT_TASK)

  console.log('3. Consulting Regent (order, rules)...')
  const regentResult = await faceTask('regent', REGENT_TASK)

  console.log('4. Consulting Shaman (emotional process)...')
  const shamanResult = await faceTask('shaman', SHAMAN_TASK)

  console.log('5. Sage: synthesizing Architect + Regent + Shaman...')
  const architectText = architectResult.reasoning || formatFallback(architectResult.output)
  const regentText = regentResult.reasoning || formatFallback(regentResult.output)
  const shamanText = shamanResult.reasoning || formatFallback(shamanResult.output)
  const sageMergeResult = await sageConsult(SAGE_MERGE_QUESTION(architectText, regentText, shamanText))

  const outputDir = join(process.cwd(), '.specify', 'specs', 'admin-agent-forge')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = join(outputDir, 'GM_CONSULT_REEVALUATION.md')

  const markdown = `# Game Master Consultation — Admin Agent Forge (EJ) Reevaluation

**Date**: ${new Date().toISOString().slice(0, 10)}
**Source**: \`npm run strand:consult:forge\`

The system has changed significantly since EJ was added to the backlog. This consultation reevaluates how the Admin Agent Forge can work in the current BARS Engine.

---

## Sage Synthesis (initial routing)

${sageResult.synthesis}

*Consulted agents: ${(sageResult.consulted_agents ?? []).join(', ') || 'N/A'}*

---

## Architect Response (schema, structure)

${architectText}

---

## Regent Response (order, rules)

${regentText}

---

## Shaman Response (emotional process)

${shamanText}

---

## Unified Reevaluation (Sage synthesis)

${sageMergeResult.synthesis}

---

## Next Steps

1. Update [spec.md](./spec.md) with revisions from the unified reevaluation.
2. Update [plan.md](./plan.md) and [tasks.md](./tasks.md) to reflect current architecture.
3. Resolve: ForgeSession vs Shadow321Session; AgentSpec/AgentPatch vs Mind/backend agents.
`

  writeFileSync(outputPath, markdown, 'utf-8')
  console.log(`\n✅ Consultation written to ${outputPath}`)
}

function formatFallback(out: unknown): string {
  if (typeof out === 'string') return out
  if (out && typeof out === 'object') {
    const o = out as Record<string, unknown>
    if (o.reasoning) return String(o.reasoning)
  }
  return '```json\n' + JSON.stringify(out, null, 2) + '\n```'
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
