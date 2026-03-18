#!/usr/bin/env npx tsx
/**
 * Consult Game Master agents on adding social elements to BARs — linking
 * Instagram, Spotify, Twitter, and other API-hosted media into BARs as
 * sources of inspiration. Players share BARs with these links to inspire
 * each other for action, tips, tricks, and podcasts.
 *
 * Usage:
 *   npm run strand:consult:bar-social
 *   # or with explicit backend:
 *   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 npx tsx scripts/strand-consult-bar-social-links.ts
 *
 * Requires: Backend running (npm run dev:backend), OPENAI_API_KEY in .env.local
 * Output: .specify/specs/bar-social-links/STRAND_CONSULT.md
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

const CONSULT_QUESTION = `We want to add **social elements to BARs** — the ability to link Instagram, Spotify, Twitter, YouTube, and other API-hosted media into a BAR. These links are sources of inspiration: players send BARs with podcasts, songs, posts, or articles to inspire each other for action, share tips and tricks, or recommend resources.

**Context:**
- BARs (Belief-Action-Reflection) are the core content unit. They have title, description, assets (images), and can be shared.
- Players want to embed: Instagram posts, Spotify tracks/playlists, Twitter/X posts, YouTube videos, podcasts (Spotify, Apple, etc.), and links in general.
- Focus: **media hosted by API platforms** — platforms that offer oEmbed, embed APIs, or structured metadata for rich previews.
- Use case: "Here's a podcast that inspired my BAR" or "This song helped me through this quest" — sharing inspiration as part of the BAR.

**Current system:**
- CustomBar: title, description, type, assets (Asset[] for bar_attachment images)
- Asset: type, url, mimeType, metadataJson, side — used for uploaded images
- No dedicated field for external links or social embeds

**Questions for the Game Master faces:**
1. **Schema**: How do we model social links? New model (BarSocialLink)? JSON field on CustomBar? Extend Asset? Platform (instagram|spotify|twitter|youtube|...), url, optional metadata (title, thumbnail, embedHtml)?
2. **Platform support**: Which platforms first? Instagram, Spotify, Twitter, YouTube have oEmbed/embed APIs. What about Apple Podcasts, Substack, TikTok? Prioritize by API availability and community use.
3. **Rich previews**: How do we render? oEmbed? Platform-specific embed iframes? Fallback to link card with metadata? Security (CSP, sandbox)?
4. **Validation & security**: URL validation, allowlist of domains, no arbitrary script injection. What rules must apply?
5. **UX**: How does a player add a link? Inline in description (auto-detect)? Dedicated "Add inspiration" section? Link picker vs paste URL?

Synthesize into structured recommendations. Be concise.`

const ARCHITECT_TASK = `[BAR Social Links — Schema & Structure]

You are the Architect. Propose:

1. **Schema for social links in BARs**: New model BarSocialLink (barId, platform, url, metadataJson, sortOrder)? Or JSON field socialLinks on CustomBar? Or extend Asset with type=social_link? Consider: queryability, filtering, future API use.

2. **Platform taxonomy**: Which platforms to support? instagram|spotify|twitter|youtube|apple_podcast|substack|tiktok|generic? Suggest a minimal set for v1 with clear extension path.

3. **Embed strategy**: oEmbed vs platform-specific APIs. Server-side fetch vs client-side. Caching, rate limits, fallback when embed fails. What's the minimal viable approach?

4. **Integration with existing BAR flow**: How does create/edit BAR flow change? Add link step? Inline in description with auto-detection? Dedicated "Inspirations" section?

Put your recommendations in the reasoning field. Be structured and concise.`

const REGENT_TASK = `[BAR Social Links — Order & Rules]

You are the Regent. Govern how social links are added and displayed. Propose:

1. **Validation rules**: URL allowlist (which domains)? Max links per BAR? Required vs optional? Platform-specific validation (e.g. Spotify track IDs)?

2. **Security rules**: No arbitrary iframes. CSP. Sandbox attributes. What must never be allowed?

3. **Moderation**: User-generated links. Do we need admin review for certain platforms? Link preview scraping — rate limits, abuse prevention?

4. **Display rules**: When does a link show as rich embed vs plain link? Fallback behavior when embed fails or platform blocks?

Put your recommendations in the reasoning field. Be structured and concise.`

const CHALLENGER_TASK = `[BAR Social Links — Risks & Blockers]

You are the Challenger. Propose:

1. **Blockers**: What could block this? Platform ToS (Instagram embed restrictions)? API rate limits? oEmbed deprecation? CORS? Be specific.

2. **Risks**: Link rot. Platform changes. Privacy (does fetching oEmbed leak viewer IP to third party)? Performance (embed fetches on BAR view)?

3. **Scope creep**: "Links in general" vs "API platforms only". Where do we draw the line? Substack? Medium? Random blog?

4. **Alternatives**: Could we just allow URLs in description and auto-link them? What do we lose?

Put your recommendations in the reasoning field. Be structured and concise.`

const DIPLOMAT_TASK = `[BAR Social Links — Community & Trust]

You are the Diplomat. The BAR is a gift; the link is part of that gift. Propose:

1. **Trust**: When a player shares a BAR with an Instagram link, the recipient may not know the sender. How does the UI convey "this is a trusted recommendation" vs "external link, be cautious"?

2. **Inspiration framing**: How do we frame the link in the BAR? "Inspired by" / "Source" / "Listen to" / "Watch"? What copy supports the ritual of sharing inspiration?

3. **Portland community**: The community has a strong allergy to AI and surveillance. Links to Spotify/Instagram — do these feel like surveillance? How do we honor that sensitivity?

4. **Belonging**: Sharing a podcast that helped you — that's vulnerable. How does the flow honor that vulnerability?

Put your recommendations in the reasoning field. Be structured and concise.`

const SAGE_MERGE_QUESTION = (
  architect: string,
  regent: string,
  challenger: string,
  diplomat: string
) => `You are the Sage. The Architect, Regent, Challenger, and Diplomat have each proposed how BAR social links should work. Synthesize their views into a single, actionable spec outline.

**Architect's proposal:**
${architect}

**Regent's proposal:**
${regent}

**Challenger's proposal:**
${challenger}

**Diplomat's proposal:**
${diplomat}

Produce a unified spec outline that:
1. Defines schema (how social links are stored)
2. Defines platform support (v1 minimal set)
3. Defines embed/preview strategy (oEmbed, fallbacks, security)
4. Defines validation and security rules
5. Defines UX (how players add links)
6. Addresses risks and mitigations
7. Honors community sensitivity (Portland, AI allergy)

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
    body: JSON.stringify({ task, feature_id: 'bar-social-links' }),
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
  console.log('Consulting Game Master agents on BAR social links...\n')
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

  console.log('2. Consulting Architect (schema, platform support)...')
  const architectResult = await faceTask('architect', ARCHITECT_TASK)

  console.log('3. Consulting Regent (validation, security)...')
  const regentResult = await faceTask('regent', REGENT_TASK)

  console.log('4. Consulting Challenger (risks, blockers)...')
  const challengerResult = await faceTask('challenger', CHALLENGER_TASK)

  console.log('5. Consulting Diplomat (trust, community)...')
  const diplomatResult = await faceTask('diplomat', DIPLOMAT_TASK)

  console.log('6. Sage: synthesizing all faces...')
  const architectText = architectResult.reasoning || formatFallback(architectResult.output)
  const regentText = regentResult.reasoning || formatFallback(regentResult.output)
  const challengerText = challengerResult.reasoning || formatFallback(challengerResult.output)
  const diplomatText = diplomatResult.reasoning || formatFallback(diplomatResult.output)
  const sageMergeResult = await sageConsult(
    SAGE_MERGE_QUESTION(architectText, regentText, challengerText, diplomatText)
  )

  const outputDir = join(process.cwd(), '.specify', 'specs', 'bar-social-links')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = join(outputDir, 'STRAND_CONSULT.md')

  const markdown = `# Strand Consultation — BAR Social Links

**Date**: ${new Date().toISOString().slice(0, 10)}
**Source**: \`npm run strand:consult:bar-social\`

**Topic**: Adding social elements to BARs — Instagram, Spotify, Twitter, YouTube, and other API-hosted media links as sources of inspiration. Players share BARs with these links to inspire each other for action, tips, tricks, and podcasts.

---

## Sage Synthesis (initial routing)

${sageResult.synthesis}

*Consulted agents: ${(sageResult.consulted_agents ?? []).join(', ') || 'N/A'}*

---

## Architect Response (schema, platform support, embed strategy)

${architectText}

---

## Regent Response (validation, security, moderation)

${regentText}

---

## Challenger Response (risks, blockers, alternatives)

${challengerText}

---

## Diplomat Response (trust, inspiration framing, community)

${diplomatText}

---

## Unified Spec Outline (Sage synthesis)

${sageMergeResult.synthesis}

---

## Next Steps

1. Create spec kit: spec.md, plan.md, tasks.md in this folder
2. Implement per GM recommendations
3. Add to backlog
`

  writeFileSync(outputPath, markdown, 'utf-8')
  console.log(`\n✅ Consultation written to ${outputPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
