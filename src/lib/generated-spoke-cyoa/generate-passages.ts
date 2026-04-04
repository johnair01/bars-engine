/**
 * GSCP — generate passage graph for generated spoke CYOA (AI or stub).
 * @see .specify/specs/generated-spoke-cyoa-pipeline/spec.md
 */
import { generateObject } from 'ai'
import { z } from 'zod'
import { getOpenAI } from '@/lib/openai'
import { validateFullAdventurePassagesGraph, type PassageRowInput } from '@/lib/story-graph/adventurePassagesGraph'
import type { GeneratedSpokeInputs } from './types'
import { FACE_META } from '@/lib/quest-grammar/types'

const GscpAiPassageSchema = z.object({
  nodeId: z.string().min(1),
  text: z.string().min(1),
  choices: z.array(
    z.object({
      text: z.string(),
      targetId: z.string(),
    }),
  ),
  isTerminal: z.boolean().optional(),
})

const GscpAiSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  startNodeId: z.string().min(1),
  passages: z.array(GscpAiPassageSchema).min(3).max(10),
})

export type GscpAiResult = z.infer<typeof GscpAiSchema>

function buildPrompt(input: GeneratedSpokeInputs): string {
  const faceLabel = FACE_META[input.gmFace]?.label ?? input.gmFace
  const hub = [
    input.hexagramId != null ? `I Ching hexagram #${input.hexagramId}${input.hexagramName ? ` (${input.hexagramName})` : ''}` : null,
    `Hub spoke index: ${input.spokeIndex} (0–7).`,
    `Kotter collective stage: ${input.kotterStage}.`,
  ]
    .filter(Boolean)
    .join(' ')

  return `You are writing a short Choose-Your-Own-Adventure for the campaign "${input.instanceName}" (ref: ${input.campaignRef}).
Domain / allyship: ${input.allyshipDomain ?? 'not specified'}.

Collective context (honest — do not invent metrics):
${input.milestoneSummary?.trim() ? input.milestoneSummary.trim() : 'No extra milestone text was supplied.'}

Fundraising / support (only reference if meaningful):
${input.fundraisingNote?.trim() ? input.fundraisingNote.trim() : 'Use gentle language; do not claim specific dollar amounts unless given above.'}

Structural placement (metadata — do not expose system jargon to the player):
${hub}

Player has already chosen:
- Four-move focus for this run: ${input.moveFocus}
- Cultivation sifu (GM lens): ${faceLabel} — frame tone and stakes accordingly; do not name "GM face" or "cultivation sifu" literally unless it feels natural in-fiction.
- Their charge (felt signal) to weave through the middle beats:
"""
${input.chargeText.trim()}
"""

Requirements:
- Exactly 3–6 passages including a single **terminal** ending.
- The **first** passage should acknowledge campaign context + collective beat + fortune flavor without dumping mechanics.
- Middle passage(s) deepen the journey using the player's charge.
- **One** terminal passage: \`isTerminal: true\`, \`choices: []\`.
- Every non-terminal passage has 1–2 choices; all \`targetId\` values must reference existing \`nodeId\` values.
- Second person, warm, concise (2–5 sentences per passage).
- Do not name "Kotter", "hexagram", or "spoke index" in player-facing text; you may use poetic fortune language.

Return JSON matching the schema (title, description, startNodeId, passages).`
}

export async function generateGscpPassagesAi(input: GeneratedSpokeInputs): Promise<GscpAiResult | null> {
  if (!process.env.OPENAI_API_KEY?.trim()) return null
  try {
    const result = await generateObject({
      model: getOpenAI()('gpt-4o-mini'),
      schema: GscpAiSchema,
      prompt: buildPrompt(input),
      maxOutputTokens: 3500,
    })
    return result.object
  } catch {
    return null
  }
}

/** Deterministic graph when AI is off or fails — still validates under UGA. */
export function buildStubGscpPassages(input: GeneratedSpokeInputs): GscpAiResult {
  const faceLabel = FACE_META[input.gmFace]?.label ?? input.gmFace
  const fortune =
    input.hexagramId != null
      ? `The draw for this path carries hexagram ${input.hexagramId}${input.hexagramName ? ` — ${input.hexagramName}` : ''}.`
      : 'You stand at this spoke of the shared wheel.'

  const open = `You are with **${input.instanceName}**. ${fortune}

${input.milestoneSummary?.trim() ? `Collective thread: ${input.milestoneSummary.trim()}` : 'Walk with what is honestly moving in the campaign right now.'}

${input.fundraisingNote?.trim() ? `Support: ${input.fundraisingNote.trim()}` : ''}

You chose **${input.moveFocus}** as your move and **${faceLabel}** as your guide. Your charge for this spoke:

_"${input.chargeText.trim().slice(0, 500)}${input.chargeText.trim().length > 500 ? '…' : ''}"_`

  const mid = `The path tightens. ${faceLabel} asks you to stay with the charge — not to fix everything, but to be precise about what matters here. Let one next step become obvious.`

  const term = `You close this spoke with clarity. What you named can travel — carry it back to the clearing when you are ready.`

  return {
    title: `Spoke ${input.spokeIndex + 1} · ${faceLabel}`,
    description: 'Generated spoke journey (stub)',
    startNodeId: 'GSCP_Open',
    passages: [
      {
        nodeId: 'GSCP_Open',
        text: open,
        choices: [{ text: 'Continue', targetId: 'GSCP_Mid' }],
      },
      {
        nodeId: 'GSCP_Mid',
        text: mid,
        choices: [{ text: 'Complete this path', targetId: 'GSCP_Terminal' }],
      },
      {
        nodeId: 'GSCP_Terminal',
        text: term,
        isTerminal: true,
        choices: [],
      },
    ],
  }
}

/** Normalize AI output: exactly one terminal, metadata applied in DB layer. */
export function normalizeGscpAiResult(ai: GscpAiResult): GscpAiResult {
  const byId = new Map(ai.passages.map((p) => [p.nodeId, p]))
  if (!byId.has(ai.startNodeId)) {
    ai.startNodeId = ai.passages[0]!.nodeId
  }
  let terminalId: string | null = null
  for (const p of ai.passages) {
    if (p.isTerminal || p.choices.length === 0) {
      terminalId = p.nodeId
    }
  }
  if (!terminalId) {
    terminalId = ai.passages[ai.passages.length - 1]!.nodeId
  }
  const passages = ai.passages.map((p) => {
    if (p.nodeId === terminalId) {
      return { ...p, choices: [], isTerminal: true }
    }
    return p
  })
  return { ...ai, passages }
}

export function validateGscpGraph(content: GscpAiResult, terminalNodeId: string): { ok: true } | { ok: false; message: string } {
  const rows: PassageRowInput[] = content.passages.map((p) => ({
    nodeId: p.nodeId,
    choicesJson: JSON.stringify(
      p.nodeId === terminalNodeId
        ? []
        : p.choices.map((c) => ({
            text: c.text,
            targetId: c.targetId,
          })),
    ),
  }))
  const v = validateFullAdventurePassagesGraph(rows, content.startNodeId)
  if (!v.ok) {
    const parts = [...(v.errors ?? []), ...(v.warnings ?? [])].map((e) =>
      typeof e === 'string' ? e : e.message
    )
    return {
      ok: false,
      message: parts.join('; ') || 'Graph validation failed',
    }
  }
  return { ok: true }
}
