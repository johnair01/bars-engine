#!/usr/bin/env npx tsx
/**
 * Conclave Docs Analyzer — Send design docs to Sage for analysis.
 *
 * Usage:
 *   npm run conclave:analyze
 *   npm run conclave:analyze -- --path "/path/to/Construc conclave (3)"
 *
 * Requires: Backend running (npm run dev:backend) with Sage agent.
 * Output: .specify/plans/conclave-analysis-{date}.md
 */

import * as fs from 'fs'
import * as path from 'path'

const DEFAULT_PATH = process.env.CONCLAVE_DOCS_PATH || path.join(process.cwd(), '.specify/fixtures/conclave-docs')
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

function parseArgs(): { path: string } {
  const args = process.argv.slice(2)
  const pathIdx = args.indexOf('--path')
  const docsPath = pathIdx >= 0 && args[pathIdx + 1] ? args[pathIdx + 1] : DEFAULT_PATH
  return { path: docsPath }
}

function readDocs(dirPath: string): Array<{ name: string; content: string }> {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Conclave docs path not found: ${dirPath}`)
  }
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const docs: Array<{ name: string; content: string }> = []
  for (const e of entries) {
    if (!e.isFile()) continue
    const ext = path.extname(e.name).toLowerCase()
    if (ext !== '.md' && ext !== '.twee') continue
    const fullPath = path.join(dirPath, e.name)
    const content = fs.readFileSync(fullPath, 'utf-8')
    docs.push({ name: e.name.replace(/\.[^.]+$/, ''), content })
  }
  return docs
}

function buildPrompt(docs: Array<{ name: string; content: string }>): string {
  const docBlocks = docs.map((d) => `## ${d.name}\n\n${d.content}`).join('\n\n---\n\n')
  return `You are analyzing Conclave design documents for ingestion into the BARS Engine spec kit.

These documents define: Orb Encounter Grammar, Orb Triadic Twee Generator, Bridge Scenario Engine, Onboarding Storytelling Grammar, and example encounter seeds.

Documents provided:

${docBlocks}

---

Tasks:
1. Extract canonical entities: GM faces, anomaly types, emotional vectors, Orb phases (context, anomaly, contact, interpretation, decision, world_response, continuation), Bridge scenario entities (seats, archetypes, phases).
2. Identify conflicts or overlaps with existing BARS Engine specs (orb-encounter-grammar, onboarding, quest-grammar).
3. Propose schema mappings: what new tables/fields are implied by these docs?
4. Suggest implementation order: dependencies, testability, which to build first.

Format your response as a structured analysis suitable for an implementation plan. Include:
- Summary of what the Conclave design system is trying to achieve
- Extracted entities (lists)
- Integration recommendations
- Suggested implementation order with rationale`
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
  const outPath = path.join(outDir, `conclave-analysis-${date}.md`)
  const header = `# Conclave Docs Analysis — ${new Date().toISOString().slice(0, 10)}

**Source:** Conclave design docs
**Agent:** Sage
${consultedAgents?.length ? `**Consulted:** ${consultedAgents.join(', ')}\n` : ''}

---
`
  const content = header + synthesis
  fs.writeFileSync(outPath, content, 'utf-8')
  return outPath
}

async function main() {
  const { path: docsPath } = parseArgs()
  console.log(`Reading Conclave docs from: ${docsPath}`)
  const docs = readDocs(docsPath)
  if (docs.length === 0) {
    console.error('No .md or .twee files found.')
    process.exit(1)
  }
  console.log(`Found ${docs.length} docs: ${docs.map((d) => d.name).join(', ')}`)
  const prompt = buildPrompt(docs)
  console.log('Calling Sage...')
  const result = await callSage(prompt)
  const outPath = writeOutput(result.synthesis, result.consulted_agents)
  console.log(`\n✓ Analysis written to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
