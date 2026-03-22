/**
 * Scene Atlas “cell BAR” template — compost-oriented structure for BARs created or placed via the 52-grid.
 * No Prisma field required: metadata lives in `completionEffects.barTemplate` + prompt/inputs elsewhere.
 *
 * @see .specify/specs/creator-scene-grid-deck/spec.md
 */

export const SCENE_ATLAS_BAR_TEMPLATE_KEY = 'scene_atlas_cell' as const
export const SCENE_ATLAS_BAR_TEMPLATE_VERSION = 1 as const

export type SceneAtlasBarTemplateMeta = {
  key: typeof SCENE_ATLAS_BAR_TEMPLATE_KEY
  version: typeof SCENE_ATLAS_BAR_TEMPLATE_VERSION
  suit: string | null
  rank: number | null
}

/** Default tags so hand / search can cluster Scene Atlas compost BARs. */
export function sceneAtlasDefaultTags(suit: string): string[] {
  const s = suit.trim()
  return s ? ['scene-atlas', s] : ['scene-atlas']
}

/**
 * Description scaffold: title names the slot; body holds the compost (commitment, boundary, next check).
 * Players edit freely — this closes the loop with Charge → BAR → deck → hand literacy.
 */
/** Merge CYOA-style answers into the cell scaffold (P1 guided path). */
export function buildGuidedSceneAtlasDescription(
  card: { displayTitle: string; rowLabel: string; rank: number },
  answers: {
    intention: string
    doneLooks: string
    careNote: string
    stakeholders?: string
    nextAction?: string
  }
): string {
  const base = buildSceneAtlasBarDescriptionScaffold(card)
  const care = answers.careNote.trim()
  const stakeholders = (answers.stakeholders ?? '').trim()
  const nextAction = (answers.nextAction ?? '').trim()
  return [
    base,
    '',
    '## Guided answers',
    '',
    '**Intention / charge:**',
    answers.intention.trim() || '—',
    '',
    '**Done / enough:**',
    answers.doneLooks.trim() || '—',
    ...(care ? ['', '**Boundary / care:**', care] : []),
    ...(stakeholders ? ['', '**Stakeholders / risk holders:**', stakeholders] : []),
    ...(nextAction ? ['', '**Next concrete step:**', nextAction] : []),
  ].join('\n')
}

/** Prefer first line of intention as title; fall back to cell display title. */
export function sceneAtlasGuidedTitle(intention: string, fallbackDisplayTitle: string): string {
  const line = intention.trim().split(/\r?\n/)[0]?.trim() ?? ''
  const t = line.slice(0, 120)
  return t || fallbackDisplayTitle
}

export function buildSceneAtlasBarDescriptionScaffold(card: {
  displayTitle: string
  rowLabel: string
  rank: number
}): string {
  return [
    `## ${card.displayTitle}`,
    `**Row:** ${card.rowLabel} · **Rank:** ${card.rank}`,
    ``,
    `**What I'm committing to in this slot:**`,
    `(A sentence or two. This is the heart of your answer.)`,
    ``,
    `**Constraint or boundary:**`,
    `(Budget, consent line, time box, or “won’t do” — whatever makes the slot real.)`,
    ``,
    `**Next check before I move on:**`,
    `(One observable step — proof the compost landed.)`,
    ``,
    `---`,
    `_Scene Atlas cell BAR — compost for your vault; refine anytime._`,
  ].join('\n')
}

export function parseSceneAtlasBarTemplateFromCompletionEffects(
  raw: string | null | undefined
): SceneAtlasBarTemplateMeta | null {
  if (!raw?.trim()) return null
  try {
    const o = JSON.parse(raw) as { barTemplate?: unknown }
    const t = o.barTemplate
    if (!t || typeof t !== 'object' || Array.isArray(t)) return null
    const rec = t as Record<string, unknown>
    if (rec.key !== SCENE_ATLAS_BAR_TEMPLATE_KEY) return null
    const version = rec.version
    if (version !== SCENE_ATLAS_BAR_TEMPLATE_VERSION) return null
    const suit = typeof rec.suit === 'string' ? rec.suit : null
    const rank = typeof rec.rank === 'number' && Number.isFinite(rec.rank) ? rec.rank : null
    return { key: SCENE_ATLAS_BAR_TEMPLATE_KEY, version: SCENE_ATLAS_BAR_TEMPLATE_VERSION, suit, rank }
  } catch {
    return null
  }
}
