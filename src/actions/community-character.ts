'use server'
/**
 * Community Character Corpus — server actions.
 *
 * Campaign owners complete the onboarding quest in CommunityCharacterWizard;
 * the wizard calls saveCommunityCharacterCorpus on completion.
 * getCommunityCharacterCorpus is used server-side to hydrate the wizard and
 * to generate EventBingoCard squares when a player assigns to an event.
 */
import { checkGM } from '@/actions/admin'
import { db } from '@/lib/db'
import type { CommunityCharacterCorpus } from '@/lib/community-character/types'

// ─── Save ─────────────────────────────────────────────────────────────────────

export async function saveCommunityCharacterCorpus(
  instanceId: string,
  corpus: CommunityCharacterCorpus,
): Promise<{ ok: true } | { error: string }> {
  try {
    await checkGM()
  } catch {
    return { error: 'Forbidden' }
  }

  if (corpus.v !== 1) return { error: 'Unknown corpus version' }
  if (!corpus.archetypeKey || !corpus.nationKey) return { error: 'Missing archetype or nation' }
  if (!Array.isArray(corpus.prompts) || corpus.prompts.length === 0) {
    return { error: 'Corpus contains no prompts' }
  }

  const instance = await db.instance.findUnique({
    where: { id: instanceId },
    select: { id: true },
  })
  if (!instance) return { error: 'Instance not found' }

  await db.instance.update({
    where: { id: instanceId },
    data: { communityCharacterCorpus: corpus as object },
  })

  return { ok: true }
}

// ─── Get ──────────────────────────────────────────────────────────────────────

export async function getCommunityCharacterCorpus(
  instanceId: string,
): Promise<CommunityCharacterCorpus | null> {
  const instance = await db.instance.findUnique({
    where: { id: instanceId },
    select: { communityCharacterCorpus: true },
  })
  if (!instance?.communityCharacterCorpus) return null

  const raw = instance.communityCharacterCorpus as unknown
  if (
    typeof raw !== 'object' ||
    raw === null ||
    (raw as { v?: unknown }).v !== 1
  ) {
    return null
  }
  return raw as CommunityCharacterCorpus
}
