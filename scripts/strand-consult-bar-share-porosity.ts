#!/usr/bin/env npx tsx
/**
 * Consult Game Master agents on BAR share porosity, preview, and link ergonomics.
 *
 * Topics:
 * 1) Unauthenticated recipients not getting preview (Open Graph? in-app?)
 * 2) Vercel links look suspicious — how to make share URLs more ergonomic/trustworthy
 * 3) Porosity model: what can be seen outside the app vs. what requires auth; security boundaries
 *
 * Usage:
 *   npm run strand:consult:bar-share-porosity
 *
 * Requires: Backend running (npm run dev:backend), OPENAI_API_KEY in .env.local
 * Output: .specify/specs/bar-share-full-preview/STRAND_CONSULT_POROSITY.md
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

const CONSULT_QUESTION = `BAR share links: recipients without accounts report not getting the preview. Vercel URLs look suspicious. We need a porosity model — what can be seen outside the app while protecting user security.

**Feedback received:**
1. When BARs are sent to people who don't already have an account, they aren't getting the preview.
2. The Vercel link (e.g. xxx.vercel.app/bar/share/TOKEN) looks quite suspicious to people.
3. We want to understand: how porous can we make the experience while protecting user security?

**Current system:**
- Share URL: /bar/share/[shareToken] — full BAR preview (photos, links, description) shown to unauthenticated users
- Open Graph: og:title, og:description, og:image, og:url on the share page
- Claim requires login/signup; preview is public
- Vercel deployment: URLs are *.vercel.app or custom domain

**Questions:**
1. Why might unauthenticated recipients not see the preview? (Open Graph unfurling? Crawler access? Redirect before render?)
2. How can we make share links more ergonomic and trustworthy? (Custom domain? Short links? Different URL shape?)
3. Porosity model: what should be visible without auth? What must stay behind auth? Security boundaries.

Synthesize into structured recommendations. Be concise.`

const ARCHITECT_TASK = `[BAR Share Porosity — Structure & URL Design]

You are the Architect. Propose:

1. **Preview failure diagnosis**: Why might unauthenticated recipients not get the preview? Consider: (a) Open Graph / meta tags — do crawlers (iOS, Slack, etc.) hit the page? (b) Redirects — does campaign-BAR redirect before the preview renders? (c) Client vs server — is the preview server-rendered so crawlers see it?

2. **URL ergonomics**: Vercel links look suspicious. Options: custom domain (conclave.example.com), short-link service (bit.ly-style), friendlier path (/r/TOKEN or /view/TOKEN), or other. What URL shape and hosting choices maximize trust?

3. **Porosity schema**: Define a clear matrix: what content is public (no auth) vs. gated (auth required). BAR share preview: public. Claim: gated. What else? Propose a simple visibility model.

Put your recommendations in the reasoning field. Be structured and concise.`

const REGENT_TASK = `[BAR Share Porosity — Order & Security]

You are the Regent. Propose:

1. **Security boundaries**: What must never be exposed without auth? (Player PII, other BARs, campaign internals?) What is safe to show in a share preview? Define the line.

2. **Token semantics**: The share token grants access to one BAR's preview. What are the revocation, expiry, and scope rules? Can we make tokens shorter or more readable without weakening security?

3. **Crawler access**: Social previews (Open Graph) require crawlers to fetch the page. Should /bar/share/[token] be fully public (no auth) for GET requests? Any rate limits or abuse concerns?

Put your recommendations in the reasoning field. Be structured and concise.`

const DIPLOMAT_TASK = `[BAR Share Porosity — Trust & First Impression]

You are the Diplomat. Propose:

1. **Link trust**: What makes a shared link feel safe vs. suspicious? Domain (custom vs. vercel.app)? URL length? Preview quality? Propose concrete changes to increase trust.

2. **Preview quality**: When someone pastes the link in iMessage/Slack, what should the unfurled card show? Sender name, BAR title, image, campaign? How do we ensure crawlers see it?

3. **First-touch framing**: The preview is the handshake. How do we frame "you're invited to view a reflection" so it feels welcoming, not like a phishing link?

Put your recommendations in the reasoning field. Be structured and concise.`

const SHAMAN_TASK = `[BAR Share Porosity — Threshold & Invitation]

You are the Shaman. Propose:

1. **Threshold crossing**: The share link is an invitation across a threshold. What blocks that crossing? (Suspicious URL, no preview, too much friction?) What facilitates it?

2. **Preview as ritual**: The preview (photos, links, description) before signup — does it serve as a "taste" that honors the recipient's agency? How porous should that taste be?

3. **Belonging before commitment**: Can we make the preview feel like "you're already welcome" rather than "sign up to see"? What's the right balance?

Put your recommendations in the reasoning field. Be structured and concise.`

const SAGE_MERGE_QUESTION = (
  architect: string,
  regent: string,
  diplomat: string,
  shaman: string
) => `You are the Sage. The Architect, Regent, Diplomat, and Shaman have each proposed how to fix BAR share preview, improve link ergonomics, and define the porosity model. Synthesize their views into a single, actionable spec outline.

**Architect's proposal:**
${architect}

**Regent's proposal:**
${regent}

**Diplomat's proposal:**
${diplomat}

**Shaman's proposal:**
${shaman}

Produce a unified spec outline that:
1. Diagnoses why unauthenticated recipients might not see the preview (with fix recommendations)
2. Proposes URL/link ergonomics improvements (custom domain, short links, etc.)
3. Defines the porosity model: what's public vs. gated; security boundaries
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
    body: JSON.stringify({ task, feature_id: 'bar-share-porosity' }),
  })
  if (!res.ok) throw new Error(`${face} task failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  const out = (data.output ?? data) as Record<string, unknown>
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
  console.log('Consulting Game Master agents on BAR share porosity, preview, link ergonomics...\n')
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

  console.log('2. Consulting Architect (structure, URL design)...')
  const architectResult = await faceTask('architect', ARCHITECT_TASK)

  console.log('3. Consulting Regent (security, boundaries)...')
  const regentResult = await faceTask('regent', REGENT_TASK)

  console.log('4. Consulting Diplomat (trust, first impression)...')
  const diplomatResult = await faceTask('diplomat', DIPLOMAT_TASK)

  console.log('5. Consulting Shaman (threshold, invitation)...')
  const shamanResult = await faceTask('shaman', SHAMAN_TASK)

  console.log('6. Sage: synthesizing all faces...')
  const architectText = architectResult.reasoning || formatFallback(architectResult.output)
  const regentText = regentResult.reasoning || formatFallback(regentResult.output)
  const diplomatText = diplomatResult.reasoning || formatFallback(diplomatResult.output)
  const shamanText = shamanResult.reasoning || formatFallback(shamanResult.output)
  const sageMergeResult = await sageConsult(
    SAGE_MERGE_QUESTION(architectText, regentText, diplomatText, shamanText)
  )

  const outputDir = join(process.cwd(), '.specify', 'specs', 'bar-share-full-preview')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = join(outputDir, 'STRAND_CONSULT_POROSITY.md')

  const markdown = `# Game Master Consultation — BAR Share Porosity, Preview, Link Ergonomic

**Date**: ${new Date().toISOString().slice(0, 10)}
**Source**: \`npm run strand:consult:bar-share-porosity\`

**Feedback:**
- Unauthenticated recipients aren't getting the preview
- Vercel links look suspicious
- Need porosity model: how porous can we be while protecting security?

---

## Sage Synthesis (initial routing)

${sageResult.synthesis}

*Consulted agents: ${(sageResult.consulted_agents ?? []).join(', ') || 'N/A'}*

---

## Architect Response (structure, URL design)

${architectResult.reasoning || formatFallback(architectResult.output)}

---

## Regent Response (security, boundaries)

${regentResult.reasoning || formatFallback(regentResult.output)}

---

## Diplomat Response (trust, first impression)

${diplomatResult.reasoning || formatFallback(diplomatResult.output)}

---

## Shaman Response (threshold, invitation)

${shamanResult.reasoning || formatFallback(shamanResult.output)}

---

## Unified Spec Outline (Sage synthesis)

${sageMergeResult.synthesis}

---

## Next Steps

1. Diagnose preview failure (crawler access? redirect? meta tags?)
2. Implement link ergonomics (custom domain, short links, etc.)
3. Document porosity model in spec
`

  writeFileSync(outputPath, markdown, 'utf-8')
  console.log(`\n✅ Consultation written to ${outputPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
