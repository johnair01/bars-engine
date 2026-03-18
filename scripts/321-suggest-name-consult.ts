#!/usr/bin/env npx tsx
/**
 * Sage consultation: How should the 6 Game Master Sects be invoked for the
 * "Suggest Name" button on the 321 Shadow Work naming step?
 *
 * Usage: npm run 321:suggest-name-consult
 *        npm run 321:suggest-name-consult -- --backend http://localhost:8000
 *
 * Output: .specify/specs/321-suggest-name/SAGE_PLAN.md
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
    : process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

const QUESTION = `We are adding a "Suggest Name" button to the 321 Shadow Work flow. At the "Give it a name" step (Face It, phase 3), the user has already written:
- **chargeDescription**: What they're carrying (e.g. "anxiety about the meeting")
- **maskShape**: If it were a presence, it would be… (e.g. "a coiled serpent with many eyes")

The button should suggest a name (e.g. "The Neurotic Medusa") based on this. We are NOT saving 321s yet — the goal is to help people pull information that's most useful for the system to metabolize.

**Your task**: Propose how to invoke the 6 Game Master Sects (Shaman, Challenger, Regent, Architect, Diplomat, Sage) for this feature. Which sect(s) should generate the suggestion? In what order? Should the Sage route, or should we call one sect directly? Be concise and actionable.`

async function main() {
  console.log('Consulting Sage on 321 Suggest Name...\n')
  console.log(`Backend: ${backendArg}`)

  try {
    const health = await fetch(`${backendArg}/api/health`)
    if (!health.ok) throw new Error('Health check failed')
  } catch {
    console.error('\n❌ Backend not reachable. Start with: npm run dev:backend')
    process.exit(1)
  }

  const res = await fetch(`${backendArg}/api/agents/sage/consult`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: QUESTION }),
  })
  if (!res.ok) {
    console.error(`Sage consult failed: ${res.status}`, await res.text())
    process.exit(1)
  }

  const data = await res.json()
  const synthesis = data.output?.synthesis ?? JSON.stringify(data.output)
  const consulted = data.output?.consulted_agents ?? []

  const outDir = join(process.cwd(), '.specify', 'specs', '321-suggest-name')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, 'SAGE_PLAN.md')

  const md = `# Sage Plan: 321 Suggest Name

**Date**: ${new Date().toISOString().slice(0, 10)}
**Source**: \`npm run 321:suggest-name-consult\`

---

## Question

How should the 6 Game Master Sects be invoked for the "Suggest Name" button on the 321 Shadow Work naming step?

---

## Sage Synthesis

${synthesis}

*Consulted agents: ${consulted.join(', ') || 'N/A'}*

---

## Implementation Notes

- Add Suggest Name button to face_3 (Give it a name) in Shadow321Runner
- Input: chargeDescription + maskShape
- Output: suggested name string (user can accept or edit)
- No persistence of 321 session yet
`

  writeFileSync(outPath, md, 'utf-8')
  console.log(`\n✅ Plan written to ${outPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
