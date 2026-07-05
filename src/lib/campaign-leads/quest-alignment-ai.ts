/**
 * Quest Studio — AI draft (decision C: AI draft is the default). Refines the same
 * { title, description, alignedAction } shape the deterministic assembler produces,
 * from the composed alignment seed. Server-only.
 *
 * Fails safe: returns null when the AI is disabled, unconfigured (no OPENAI_API_KEY),
 * or errors — the caller then falls back to `assembleAlignedQuest`. So the invitee
 * path never depends on a model call.
 */
import 'server-only'
import { generateObject } from 'ai'
import { z } from 'zod'
import { getOpenAI } from '@/lib/openai'
import { getDomainLabel } from '@/lib/allyship-domains'
import type { AlignedQuestDraft, AlignmentSeed } from './quest-alignment'

const draftSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(20).max(900),
  alignedAction: z.string().min(6).max(300),
})

function buildPrompt(seed: AlignmentSeed): string {
  const lines: string[] = [
    'You are drafting ONE short allyship quest for a campaign. A quest has a title, a 2–4 sentence',
    'description in warm second person ("you"), and a single concrete aligned action.',
    'Compose from these lenses (ignore any that are blank):',
  ]
  if (seed.domain) lines.push(`- Domain (where the work happens): ${getDomainLabel(seed.domain)}`)
  if (seed.mythReframe) lines.push(`- Reframe to embody (an allyship myth, busted): ${seed.mythReframe}`)
  if (seed.superpower && seed.superpowerPrompt) {
    lines.push(`- Superpower "${seed.superpower}" (${seed.orientation}) asks: ${seed.superpowerPrompt}`)
    if (seed.superpowerArtifact) lines.push(`  It should produce: ${seed.superpowerArtifact}`)
  }
  if (seed.gmFace && seed.faceMoveTitle) {
    lines.push(`- Game-Master face "${seed.gmFace}" opening move: ${seed.faceMoveTitle} — ${seed.faceMoveAction ?? ''}`)
  }
  lines.push('Keep it doable in a week. No preamble. Return the structured fields only.')
  return lines.join('\n')
}

/** Returns a refined draft, or null to signal the caller to use the deterministic fallback. */
export async function aiDraftAlignedQuest(seed: AlignmentSeed): Promise<AlignedQuestDraft | null> {
  if (process.env.QUEST_STUDIO_AI_ENABLED === 'false') return null
  try {
    const { object } = await generateObject({
      model: getOpenAI()('gpt-4o-mini'),
      schema: draftSchema,
      prompt: buildPrompt(seed),
    })
    return object
  } catch (e) {
    console.warn('[quest-studio] AI draft failed, falling back to deterministic assembly:', e instanceof Error ? e.message : e)
    return null
  }
}
