#!/usr/bin/env npx tsx
/**
 * Gather-Clone Analyzer — Send gather-clone editor code to Sage for integration analysis.
 *
 * Usage:
 *   npm run gather:analyze
 *
 * Requires: Backend running (npm run dev:backend) with Sage agent.
 * Output: .specify/plans/gather-clone-gm-analysis-{date}.md
 *
 * Fetches key files from https://github.com/trevorwrightdev/gather-clone
 * and asks Sage to recommend integration for BARS (campaign map, encounter spaces, lobby).
 */

import * as fs from 'fs'
import * as path from 'path'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
const GATHER_CLONE_BASE = 'https://raw.githubusercontent.com/trevorwrightdev/gather-clone/main'

const FILES_TO_FETCH = [
  'frontend/app/editor/Editor.tsx',
  'frontend/app/editor/RoomItem.tsx',
  'frontend/utils/pixi/types.ts',
  'backend/src/session.ts',
] as const

async function fetchFile(relativePath: string): Promise<string> {
  const url = `${GATHER_CLONE_BASE}/${relativePath}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) return `[Failed to fetch: ${res.status}]`
  return res.text()
}

async function gatherCode(): Promise<string> {
  const parts: string[] = []
  for (const p of FILES_TO_FETCH) {
    const content = await fetchFile(p)
    parts.push(`## ${p}\n\n\`\`\`\n${content.slice(0, 8000)}\n\`\`\``)
  }
  return parts.join('\n\n---\n\n')
}

function buildPrompt(codeSummary: string): string {
  return `You are analyzing the gather-clone tile map editor (https://github.com/trevorwrightdev/gather-clone) for integration into the BARS Engine.

BARS is a Next.js + Prisma app with: quest grammar, campaign map (graph-based), encounter spaces (transformation encounters), and lobby navigation (Library, EFA, Dojos, Gameboard).

Key gather-clone code provided:

${codeSummary}

---

Tasks:
1. **Architecture**: How would you extract/port the editor into BARS? What to keep vs replace (Supabase → Prisma, signal → React state)?
2. **Data model**: RealmData has spawnpoint, rooms[], each room has tilemap with "x, y" keys and floor/above_floor/object/impassable/teleporter. How does this map to BARS schema (Instance, Adventure, graph nodes)?
3. **Spatial rooms → graph nodes**: BARS has graph maps (Twine passages, campaign map nodes). Spatial rooms should link to graph nodes. Propose a link model.
4. **RPG Maker import**: gather-clone uses custom spritesheets. RPG Maker uses MapXXX.json (width, height, data array) + Tilesets. How to convert? What about events (doors, NPCs)?
5. **Risks**: What could go wrong? Coupling, performance, migration path.

Format your response as a structured analysis suitable for an implementation plan.`
}

async function callSage(question: string): Promise<{ synthesis: string; consulted_agents?: string[] }> {
  const res = await fetch(`${BACKEND_URL}/api/agents/sage/consult`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
    signal: AbortSignal.timeout(120_000),
  })
  if (!res.ok) {
    throw new Error(`Sage consult failed: ${res.status} ${res.statusText}. Is the backend running? (npm run dev:backend)`)
  }
  const data = await res.json()
  const output = data?.output ?? data
  return {
    synthesis: typeof output === 'string' ? output : output?.synthesis ?? JSON.stringify(output),
    consulted_agents: output?.consulted_agents,
  }
}

function writeOutput(synthesis: string, consultedAgents: string[] | undefined): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const outDir = path.join(process.cwd(), '.specify/plans')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }
  const outPath = path.join(outDir, `gather-clone-gm-analysis-${date}.md`)
  const header = `# Gather-Clone GM Analysis — ${new Date().toISOString().slice(0, 10)}

**Source:** https://github.com/trevorwrightdev/gather-clone
**Agent:** Sage
${consultedAgents?.length ? `**Consulted:** ${consultedAgents.join(', ')}\n` : ''}

---
`
  const content = header + synthesis
  fs.writeFileSync(outPath, content, 'utf-8')
  return outPath
}

async function main() {
  console.log('Fetching gather-clone code...')
  const codeSummary = await gatherCode()
  console.log('Building prompt and calling Sage...')
  const prompt = buildPrompt(codeSummary)
  const result = await callSage(prompt)
  const outPath = writeOutput(result.synthesis, result.consulted_agents)
  console.log(`\n✓ Analysis written to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
